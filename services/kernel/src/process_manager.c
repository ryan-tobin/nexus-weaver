/*
 * Nexus Weaver Kernel
 * Copyright (c) 2024 Nexus Weaver Project
 * 
 * File: process_manager.c
 * Description: Process management implementation
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <errno.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <pthread.h>
#include <time.h>

#include "kernel.h"
#include "process_manager.h"
#include "cgroup_manager.h"

/* Process entry in the manager */
typedef struct process_entry {
    process_info_t info;
    process_stats_t stats;
    pthread_mutex_t lock;
    struct process_entry *next;
} process_entry_t;

/* Process manager structure */
struct process_manager {
    process_entry_t *processes;     /* Linked list of processes */
    pthread_mutex_t list_lock;      /* Lock for process list */
    cgroup_manager_t *cgroup_mgr;   /* cgroup manager instance */
    process_event_cb event_cb;      /* Event callback */
    void *event_cb_data;           /* Event callback user data */
    bool running;                   /* Manager running flag */
    pthread_t monitor_thread;       /* Process monitor thread */
};

/* Forward declarations */
static void* process_monitor_thread(void *arg);
static process_entry_t* find_process_entry(process_manager_t *pm, const char *process_id);
static void update_process_state(process_manager_t *pm, process_entry_t *entry, 
                               process_state_t new_state);
static nw_error_t setup_process_environment(const process_info_t *info);

/* Initialize process manager */
nw_error_t pm_init(process_manager_t **pm, const kernel_config_t *config) {
    if (!pm || !config) {
        return NW_ERROR_INVALID_PARAM;
    }

    *pm = calloc(1, sizeof(process_manager_t));
    if (!*pm) {
        return NW_ERROR_NO_MEMORY;
    }

    /* Initialize mutex */
    if (pthread_mutex_init(&(*pm)->list_lock, NULL) != 0) {
        free(*pm);
        *pm = NULL;
        return NW_ERROR_GENERAL;
    }

    (*pm)->running = true;

    /* Start monitor thread */
    if (pthread_create(&(*pm)->monitor_thread, NULL, process_monitor_thread, *pm) != 0) {
        pthread_mutex_destroy(&(*pm)->list_lock);
        free(*pm);
        *pm = NULL;
        return NW_ERROR_GENERAL;
    }

    nw_log("INFO", "Process manager initialized");
    return NW_SUCCESS;
}

/* Cleanup process manager */
void pm_cleanup(process_manager_t *pm) {
    if (!pm) {
        return;
    }

    /* Stop monitor thread */
    pm->running = false;
    pthread_join(pm->monitor_thread, NULL);

    /* Stop all processes */
    pm_stop_all_processes(pm);

    /* Free process list */
    pthread_mutex_lock(&pm->list_lock);
    process_entry_t *entry = pm->processes;
    while (entry) {
        process_entry_t *next = entry->next;
        pthread_mutex_destroy(&entry->lock);
        free(entry);
        entry = next;
    }
    pthread_mutex_unlock(&pm->list_lock);

    pthread_mutex_destroy(&pm->list_lock);
    free(pm);

    nw_log("INFO", "Process manager cleaned up");
}

/* Start a new process */
nw_error_t pm_start_process(process_manager_t *pm, const process_info_t *info) {
    if (!pm || !info) {
        return NW_ERROR_INVALID_PARAM;
    }

    /* Check if process already exists */
    if (find_process_entry(pm, info->id)) {
        return NW_ERROR_ALREADY_EXISTS;
    }

    /* Create process entry */
    process_entry_t *entry = calloc(1, sizeof(process_entry_t));
    if (!entry) {
        return NW_ERROR_NO_MEMORY;
    }

    memcpy(&entry->info, info, sizeof(process_info_t));
    pthread_mutex_init(&entry->lock, NULL);

    /* Create cgroup for the process */
    if (pm->cgroup_mgr) {
        nw_error_t err = cg_create_group(pm->cgroup_mgr, info->id);
        if (err != NW_SUCCESS) {
            nw_log("ERROR", "Failed to create cgroup for process %s: %s", 
                   info->id, nw_error_string(err));
            pthread_mutex_destroy(&entry->lock);
            free(entry);
            return err;
        }

        /* Apply resource limits */
        err = cg_apply_limits(pm->cgroup_mgr, info->id, &info->limits);
        if (err != NW_SUCCESS) {
            nw_log("WARN", "Failed to apply resource limits for process %s: %s",
                   info->id, nw_error_string(err));
        }
    }

    /* Fork and exec the process */
    pid_t pid = fork();
    if (pid < 0) {
        nw_log("ERROR", "Failed to fork process %s: %s", info->id, strerror(errno));
        if (pm->cgroup_mgr) {
            cg_remove_group(pm->cgroup_mgr, info->id);
        }
        pthread_mutex_destroy(&entry->lock);
        free(entry);
        return NW_ERROR_PROCESS_FAILED;
    }

    if (pid == 0) {
        /* Child process */
        
        /* Set up process environment */
        if (setup_process_environment(info) != NW_SUCCESS) {
            _exit(EXIT_FAILURE);
        }

        /* Execute the command */
        char *args[64];
        char cmd_copy[MAX_PATH_LENGTH];
        strncpy(cmd_copy, info->command, sizeof(cmd_copy) - 1);
        cmd_copy[sizeof(cmd_copy) - 1] = '\0';  /* Ensure null termination */
        
        /* Simple command parsing (space-separated) */
        int argc = 0;
        char *token = strtok(cmd_copy, " ");
        while (token && argc < 63) {
            args[argc++] = token;
            token = strtok(NULL, " ");
        }
        args[argc] = NULL;

        execvp(args[0], args);
        
        /* If we get here, exec failed */
        nw_log("ERROR", "Failed to exec %s: %s", args[0], strerror(errno));
        _exit(EXIT_FAILURE);
    }

    /* Parent process */
    entry->info.pid = pid;
    entry->info.start_time = time(NULL);
    entry->info.state = PROCESS_STATE_RUNNING;

    /* Add process to cgroup */
    if (pm->cgroup_mgr) {
        nw_error_t err = cg_add_process(pm->cgroup_mgr, info->id, pid);
        if (err != NW_SUCCESS) {
            nw_log("WARN", "Failed to add process %d to cgroup %s: %s",
                   pid, info->id, nw_error_string(err));
        }
    }

    /* Add to process list */
    pthread_mutex_lock(&pm->list_lock);
    entry->next = pm->processes;
    pm->processes = entry;
    pthread_mutex_unlock(&pm->list_lock);

    nw_log("INFO", "Started process %s (PID %d): %s", info->id, pid, info->command);
    return NW_SUCCESS;
}

/* Stop a process */
nw_error_t pm_stop_process(process_manager_t *pm, const char *process_id) {
    if (!pm || !process_id) {
        return NW_ERROR_INVALID_PARAM;
    }

    process_entry_t *entry = find_process_entry(pm, process_id);
    if (!entry) {
        return NW_ERROR_NOT_FOUND;
    }

    pthread_mutex_lock(&entry->lock);
    
    if (entry->info.state != PROCESS_STATE_RUNNING) {
        pthread_mutex_unlock(&entry->lock);
        return NW_SUCCESS;
    }

    /* Send SIGTERM first */
    if (kill(entry->info.pid, SIGTERM) < 0) {
        if (errno != ESRCH) {
            pthread_mutex_unlock(&entry->lock);
            return NW_ERROR_PROCESS_FAILED;
        }
    }

    /* Give process time to terminate gracefully */
    sleep(2);

    /* Check if process still exists */
    if (kill(entry->info.pid, 0) == 0) {
        /* Process still running, send SIGKILL */
        kill(entry->info.pid, SIGKILL);
    }

    update_process_state(pm, entry, PROCESS_STATE_STOPPED);
    pthread_mutex_unlock(&entry->lock);

    nw_log("INFO", "Stopped process %s (PID %d)", process_id, entry->info.pid);
    return NW_SUCCESS;
}

/* Get process information */
nw_error_t pm_get_process(process_manager_t *pm, const char *process_id, 
                          process_info_t *info) {
    if (!pm || !process_id || !info) {
        return NW_ERROR_INVALID_PARAM;
    }

    process_entry_t *entry = find_process_entry(pm, process_id);
    if (!entry) {
        return NW_ERROR_NOT_FOUND;
    }

    pthread_mutex_lock(&entry->lock);
    memcpy(info, &entry->info, sizeof(process_info_t));
    pthread_mutex_unlock(&entry->lock);

    return NW_SUCCESS;
}

/* List all processes */
nw_error_t pm_list_processes(process_manager_t *pm, process_info_t **list, 
                            size_t *count) {
    if (!pm || !list || !count) {
        return NW_ERROR_INVALID_PARAM;
    }

    pthread_mutex_lock(&pm->list_lock);

    /* Count processes */
    *count = 0;
    process_entry_t *entry = pm->processes;
    while (entry) {
        (*count)++;
        entry = entry->next;
    }

    if (*count == 0) {
        *list = NULL;
        pthread_mutex_unlock(&pm->list_lock);
        return NW_SUCCESS;
    }

    /* Allocate array */
    *list = malloc(*count * sizeof(process_info_t));
    if (!*list) {
        pthread_mutex_unlock(&pm->list_lock);
        return NW_ERROR_NO_MEMORY;
    }

    /* Copy process info */
    size_t i = 0;
    entry = pm->processes;
    while (entry && i < *count) {
        pthread_mutex_lock(&entry->lock);
        memcpy(&(*list)[i], &entry->info, sizeof(process_info_t));
        pthread_mutex_unlock(&entry->lock);
        i++;
        entry = entry->next;
    }

    pthread_mutex_unlock(&pm->list_lock);
    return NW_SUCCESS;
}

/* Update resource limits */
nw_error_t pm_update_limits(process_manager_t *pm, const char *process_id,
                           const resource_limits_t *limits) {
    if (!pm || !process_id || !limits) {
        return NW_ERROR_INVALID_PARAM;
    }

    process_entry_t *entry = find_process_entry(pm, process_id);
    if (!entry) {
        return NW_ERROR_NOT_FOUND;
    }

    pthread_mutex_lock(&entry->lock);
    
    /* Update limits in cgroup */
    if (pm->cgroup_mgr) {
        nw_error_t err = cg_apply_limits(pm->cgroup_mgr, process_id, limits);
        if (err != NW_SUCCESS) {
            pthread_mutex_unlock(&entry->lock);
            return err;
        }
    }

    /* Update stored limits */
    memcpy(&entry->info.limits, limits, sizeof(resource_limits_t));
    
    pthread_mutex_unlock(&entry->lock);
    return NW_SUCCESS;
}

/* Stop all processes */
nw_error_t pm_stop_all_processes(process_manager_t *pm) {
    if (!pm) {
        return NW_ERROR_INVALID_PARAM;
    }

    pthread_mutex_lock(&pm->list_lock);
    process_entry_t *entry = pm->processes;
    
    while (entry) {
        pthread_mutex_lock(&entry->lock);
        if (entry->info.state == PROCESS_STATE_RUNNING) {
            kill(entry->info.pid, SIGTERM);
        }
        pthread_mutex_unlock(&entry->lock);
        entry = entry->next;
    }
    
    pthread_mutex_unlock(&pm->list_lock);

    /* Wait for processes to terminate */
    sleep(2);

    /* Force kill any remaining processes */
    pthread_mutex_lock(&pm->list_lock);
    entry = pm->processes;
    
    while (entry) {
        pthread_mutex_lock(&entry->lock);
        if (entry->info.state == PROCESS_STATE_RUNNING) {
            kill(entry->info.pid, SIGKILL);
        }
        pthread_mutex_unlock(&entry->lock);
        entry = entry->next;
    }
    
    pthread_mutex_unlock(&pm->list_lock);

    return NW_SUCCESS;
}

/* Process monitor thread */
static void* process_monitor_thread(void *arg) {
    process_manager_t *pm = (process_manager_t *)arg;
    
    while (pm->running) {
        pm_check_processes(pm);
        sleep(1);
    }
    
    return NULL;
}

/* Check process states */
void pm_check_processes(process_manager_t *pm) {
    if (!pm) {
        return;
    }

    pthread_mutex_lock(&pm->list_lock);
    process_entry_t *entry = pm->processes;
    
    while (entry) {
        pthread_mutex_lock(&entry->lock);
        
        if (entry->info.state == PROCESS_STATE_RUNNING) {
            int status;
            pid_t result = waitpid(entry->info.pid, &status, WNOHANG);
            
            if (result > 0) {
                /* Process has terminated */
                if (WIFEXITED(status)) {
                    nw_log("INFO", "Process %s (PID %d) exited with code %d",
                           entry->info.id, entry->info.pid, WEXITSTATUS(status));
                    update_process_state(pm, entry, PROCESS_STATE_TERMINATED);
                } else if (WIFSIGNALED(status)) {
                    nw_log("WARN", "Process %s (PID %d) killed by signal %d",
                           entry->info.id, entry->info.pid, WTERMSIG(status));
                    update_process_state(pm, entry, PROCESS_STATE_FAILED);
                }
                
                /* Remove from cgroup */
                if (pm->cgroup_mgr) {
                    cg_remove_group(pm->cgroup_mgr, entry->info.id);
                }
            } else if (result < 0 && errno == ECHILD) {
                /* Process doesn't exist */
                update_process_state(pm, entry, PROCESS_STATE_TERMINATED);
            }
        }
        
        pthread_mutex_unlock(&entry->lock);
        entry = entry->next;
    }
    
    pthread_mutex_unlock(&pm->list_lock);
}

/* Helper functions */

static process_entry_t* find_process_entry(process_manager_t *pm, const char *process_id) {
    pthread_mutex_lock(&pm->list_lock);
    process_entry_t *entry = pm->processes;
    
    while (entry) {
        if (strcmp(entry->info.id, process_id) == 0) {
            pthread_mutex_unlock(&pm->list_lock);
            return entry;
        }
        entry = entry->next;
    }
    
    pthread_mutex_unlock(&pm->list_lock);
    return NULL;
}

static void update_process_state(process_manager_t *pm, process_entry_t *entry, 
                               process_state_t new_state) {
    process_state_t old_state = entry->info.state;
    entry->info.state = new_state;
    
    if (pm->event_cb && old_state != new_state) {
        pm->event_cb(entry->info.id, old_state, new_state, pm->event_cb_data);
    }
}

static nw_error_t setup_process_environment(const process_info_t *info) {
    /* Change working directory */
    if (info->working_dir[0] != '\0') {
        if (chdir(info->working_dir) < 0) {
            nw_log("ERROR", "Failed to change directory to %s: %s",
                   info->working_dir, strerror(errno));
            return NW_ERROR_IO;
        }
    }

    /* Set user and group if specified */
    if (info->gid != 0) {
        if (setgid(info->gid) < 0) {
            nw_log("ERROR", "Failed to set GID to %d: %s", 
                   info->gid, strerror(errno));
            return NW_ERROR_PERMISSION_DENIED;
        }
    }

    if (info->uid != 0) {
        if (setuid(info->uid) < 0) {
            nw_log("ERROR", "Failed to set UID to %d: %s",
                   info->uid, strerror(errno));
            return NW_ERROR_PERMISSION_DENIED;
        }
    }

    return NW_SUCCESS;
}

/* Set/get cgroup manager */
void pm_set_cgroup_manager(process_manager_t *pm, cgroup_manager_t *cg) {
    if (pm) {
        pm->cgroup_mgr = cg;
    }
}

cgroup_manager_t* pm_get_cgroup_manager(process_manager_t *pm) {
    return pm ? pm->cgroup_mgr : NULL;
}

/* Get process statistics */
nw_error_t pm_get_process_stats(process_manager_t *pm, const char *process_id,
                               process_stats_t *stats) {
    if (!pm || !process_id || !stats) {
        return NW_ERROR_INVALID_PARAM;
    }

    process_entry_t *entry = find_process_entry(pm, process_id);
    if (!entry) {
        return NW_ERROR_NOT_FOUND;
    }

    pthread_mutex_lock(&entry->lock);
    
    /* Get stats from cgroup if available */
    if (pm->cgroup_mgr) {
        /* TODO: Implement cgroup stats reading */
        memset(stats, 0, sizeof(process_stats_t));
    } else {
        memcpy(stats, &entry->stats, sizeof(process_stats_t));
    }
    
    pthread_mutex_unlock(&entry->lock);
    return NW_SUCCESS;
}

/* Register process event callback */
void pm_register_event_callback(process_manager_t *pm, process_event_cb callback,
                               void *user_data) {
    if (pm) {
        pm->event_cb = callback;
        pm->event_cb_data = user_data;
    }
}