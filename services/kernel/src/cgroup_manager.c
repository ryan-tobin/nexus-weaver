/*
 * Nexus Weaver Kernel
 * Copyright (c) 2024 Nexus Weaver Project
 * 
 * File: cgroup_manager.c
 * Description: cgroup v2 management implementation
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <linux/limits.h>

#include "kernel.h"
#include "cgroup_manager.h"

#define CGROUP_PROCS "cgroup.procs"
#define CGROUP_CONTROLLERS "cgroup.controllers"
#define CGROUP_SUBTREE_CONTROL "cgroup.subtree_control"

/* cgroup manager structure */
struct cgroup_manager {
    char root_path[PATH_MAX];
    char nexus_path[PATH_MAX];  /* Our cgroup hierarchy root */
    bool v2_available;
};

/* Forward declarations of helper functions */
static int write_file(const char *path, const char *value);
static int read_file(const char *path, char *buffer, size_t size);
static bool path_exists(const char *path);
static nw_error_t enable_controllers(const char *cgroup_path);

/* Check if cgroups v2 is available */
bool cg_is_v2_available(void) {
    struct stat st;
    
    /* Check if cgroup2 filesystem is mounted at the standard location */
    if (stat("/sys/fs/cgroup", &st) != 0) {
        return false;
    }
    
    /* Check for cgroup.controllers file (v2 specific) */
    return path_exists("/sys/fs/cgroup/cgroup.controllers");
}

/* Initialize cgroup manager */
nw_error_t cg_init(cgroup_manager_t **cg, const char *cgroup_root) {
    if (!cg || !cgroup_root) {
        return NW_ERROR_INVALID_PARAM;
    }

    *cg = calloc(1, sizeof(cgroup_manager_t));
    if (!*cg) {
        return NW_ERROR_NO_MEMORY;
    }

    strncpy((*cg)->root_path, cgroup_root, PATH_MAX - 1);
    
    /* Check if cgroups v2 is available */
    (*cg)->v2_available = cg_is_v2_available();
    if (!(*cg)->v2_available) {
        nw_log("ERROR", "cgroups v2 not available on this system");
        free(*cg);
        *cg = NULL;
        return NW_ERROR_CGROUP_FAILED;
    }

    /* Create our root cgroup hierarchy */
    snprintf((*cg)->nexus_path, PATH_MAX, "%s/nexus_weaver", (*cg)->root_path);
    
    if (mkdir((*cg)->nexus_path, 0755) < 0 && errno != EEXIST) {
        nw_log("ERROR", "Failed to create nexus_weaver cgroup: %s", strerror(errno));
        free(*cg);
        *cg = NULL;
        return NW_ERROR_CGROUP_FAILED;
    }

    /* Enable required controllers */
    if (enable_controllers((*cg)->root_path) != NW_SUCCESS) {
        nw_log("WARN", "Failed to enable some controllers");
    }

    nw_log("INFO", "cgroup manager initialized with root: %s", (*cg)->nexus_path);
    return NW_SUCCESS;
}

/* Cleanup cgroup manager */
void cg_cleanup(cgroup_manager_t *cg) {
    if (!cg) {
        return;
    }

    /* Note: We don't remove the nexus_weaver cgroup here as there might
     * still be processes in it. Cleanup should be done separately. */
    
    free(cg);
    nw_log("INFO", "cgroup manager cleaned up");
}

/* Create cgroup for process */
nw_error_t cg_create_group(cgroup_manager_t *cg, const char *group_name) {
    if (!cg || !group_name) {
        return NW_ERROR_INVALID_PARAM;
    }

    char group_path[PATH_MAX];
    snprintf(group_path, PATH_MAX, "%s/%s", cg->nexus_path, group_name);

    if (mkdir(group_path, 0755) < 0) {
        if (errno == EEXIST) {
            return NW_ERROR_ALREADY_EXISTS;
        }
        nw_log("ERROR", "Failed to create cgroup %s: %s", group_name, strerror(errno));
        return NW_ERROR_CGROUP_FAILED;
    }

    /* Enable controllers for this cgroup */
    if (enable_controllers(cg->nexus_path) != NW_SUCCESS) {
        nw_log("WARN", "Failed to enable controllers for cgroup %s", group_name);
    }

    nw_log("DEBUG", "Created cgroup: %s", group_name);
    return NW_SUCCESS;
}

/* Remove cgroup */
nw_error_t cg_remove_group(cgroup_manager_t *cg, const char *group_name) {
    if (!cg || !group_name) {
        return NW_ERROR_INVALID_PARAM;
    }

    char group_path[PATH_MAX];
    snprintf(group_path, PATH_MAX, "%s/%s", cg->nexus_path, group_name);

    /* Check if cgroup exists */
    if (!path_exists(group_path)) {
        return NW_ERROR_NOT_FOUND;
    }

    /* Remove the cgroup directory (must be empty) */
    if (rmdir(group_path) < 0) {
        nw_log("ERROR", "Failed to remove cgroup %s: %s", group_name, strerror(errno));
        return NW_ERROR_CGROUP_FAILED;
    }

    nw_log("DEBUG", "Removed cgroup: %s", group_name);
    return NW_SUCCESS;
}

/* Apply resource limits */
nw_error_t cg_apply_limits(cgroup_manager_t *cg, const char *group_name,
                          const resource_limits_t *limits) {
    if (!cg || !group_name || !limits) {
        return NW_ERROR_INVALID_PARAM;
    }

    char group_path[PATH_MAX];
    char file_path[PATH_MAX];
    char value[64];

    snprintf(group_path, PATH_MAX, "%s/%s", cg->nexus_path, group_name);

    /* Set memory limit */
    if (limits->memory_bytes > 0) {
        snprintf(file_path, PATH_MAX, "%s/memory.max", group_path);
        snprintf(value, sizeof(value), "%lu", limits->memory_bytes);
        
        if (write_file(file_path, value) < 0) {
            nw_log("WARN", "Failed to set memory limit for %s", group_name);
        }
    }

    /* Set CPU limits */
    if (limits->cpu_quota_us > 0 && limits->cpu_period_us > 0) {
        snprintf(file_path, PATH_MAX, "%s/cpu.max", group_path);
        snprintf(value, sizeof(value), "%u %u", 
                 limits->cpu_quota_us, limits->cpu_period_us);
        
        if (write_file(file_path, value) < 0) {
            nw_log("WARN", "Failed to set CPU quota for %s", group_name);
        }
    }

    /* Set PIDs limit */
    if (limits->pids_limit > 0) {
        snprintf(file_path, PATH_MAX, "%s/pids.max", group_path);
        snprintf(value, sizeof(value), "%u", limits->pids_limit);
        
        if (write_file(file_path, value) < 0) {
            nw_log("WARN", "Failed to set PIDs limit for %s", group_name);
        }
    }

    return NW_SUCCESS;
}

/* Add process to cgroup */
nw_error_t cg_add_process(cgroup_manager_t *cg, const char *group_name, pid_t pid) {
    if (!cg || !group_name || pid <= 0) {
        return NW_ERROR_INVALID_PARAM;
    }

    char procs_path[PATH_MAX];
    char pid_str[32];

    snprintf(procs_path, PATH_MAX, "%s/%s/%s", cg->nexus_path, group_name, CGROUP_PROCS);
    snprintf(pid_str, sizeof(pid_str), "%d", pid);

    if (write_file(procs_path, pid_str) < 0) {
        nw_log("ERROR", "Failed to add PID %d to cgroup %s: %s", 
               pid, group_name, strerror(errno));
        return NW_ERROR_CGROUP_FAILED;
    }

    nw_log("DEBUG", "Added PID %d to cgroup %s", pid, group_name);
    return NW_SUCCESS;
}

/* Get cgroup statistics */
nw_error_t cg_get_stats(cgroup_manager_t *cg, const char *group_name,
                       cgroup_stats_t *stats) {
    if (!cg || !group_name || !stats) {
        return NW_ERROR_INVALID_PARAM;
    }

    char group_path[PATH_MAX];
    char file_path[PATH_MAX];
    char buffer[256];

    snprintf(group_path, PATH_MAX, "%s/%s", cg->nexus_path, group_name);
    memset(stats, 0, sizeof(cgroup_stats_t));

    /* Read memory stats */
    snprintf(file_path, PATH_MAX, "%s/memory.current", group_path);
    if (read_file(file_path, buffer, sizeof(buffer)) >= 0) {
        stats->memory_current = strtoull(buffer, NULL, 10);
    }

    snprintf(file_path, PATH_MAX, "%s/memory.peak", group_path);
    if (read_file(file_path, buffer, sizeof(buffer)) >= 0) {
        stats->memory_max = strtoull(buffer, NULL, 10);
    }

    /* Read CPU stats */
    snprintf(file_path, PATH_MAX, "%s/cpu.stat", group_path);
    FILE *fp = fopen(file_path, "r");
    if (fp) {
        while (fgets(buffer, sizeof(buffer), fp)) {
            uint64_t value;
            if (sscanf(buffer, "usage_usec %lu", &value) == 1) {
                stats->cpu_usage_usec = value;
            } else if (sscanf(buffer, "nr_periods %u", &stats->nr_periods) == 1) {
                /* Already assigned */
            } else if (sscanf(buffer, "nr_throttled %u", &stats->nr_throttled) == 1) {
                /* Already assigned */
            } else if (sscanf(buffer, "throttled_usec %lu", &value) == 1) {
                stats->throttled_usec = value;
            }
        }
        fclose(fp);
    }

    return NW_SUCCESS;
}

/* Helper functions implementation */

static int write_file(const char *path, const char *value) {
    int fd = open(path, O_WRONLY);
    if (fd < 0) {
        return -1;
    }

    ssize_t len = strlen(value);
    ssize_t written = write(fd, value, len);
    close(fd);

    return (written == len) ? 0 : -1;
}

static int read_file(const char *path, char *buffer, size_t size) {
    int fd = open(path, O_RDONLY);
    if (fd < 0) {
        return -1;
    }

    ssize_t bytes = read(fd, buffer, size - 1);
    close(fd);

    if (bytes > 0) {
        buffer[bytes] = '\0';
        /* Remove trailing newline if present */
        if (bytes > 0 && buffer[bytes - 1] == '\n') {
            buffer[bytes - 1] = '\0';
        }
        return 0;
    }

    return -1;
}

static bool path_exists(const char *path) {
    struct stat st;
    return stat(path, &st) == 0;
}

static nw_error_t enable_controllers(const char *cgroup_path) {
    char controllers_path[PATH_MAX];
    char subtree_path[PATH_MAX];
    char buffer[256];

    /* Read available controllers */
    snprintf(controllers_path, PATH_MAX, "%s/%s", cgroup_path, CGROUP_CONTROLLERS);
    if (read_file(controllers_path, buffer, sizeof(buffer)) < 0) {
        return NW_ERROR_CGROUP_FAILED;
    }

    /* Enable controllers in subtree_control */
    snprintf(subtree_path, PATH_MAX, "%s/%s", cgroup_path, CGROUP_SUBTREE_CONTROL);
    
    /* Enable each controller */
    char *controller = strtok(buffer, " \n");
    while (controller) {
        char enable_cmd[64];
        snprintf(enable_cmd, sizeof(enable_cmd), "+%s", controller);
        
        if (write_file(subtree_path, enable_cmd) < 0) {
            nw_log("WARN", "Failed to enable controller %s", controller);
        }
        
        controller = strtok(NULL, " \n");
    }

    return NW_SUCCESS;
}