/**
 * Nexus Weaver Kernel
 * Copyright (c) 2024 Nexus Weaver Project
 *
 * File: kernel.h
 * Description: Main header file for the Nexus Weaver kernel,
 * which manages processes and resources on each node in the cluster.
 */

#ifndef NEXUS_WEAVER_KERNEL_H
#define NEXUS_WEAVER_KERNEL_H

#include <stdint.h>
#include <stdbool.h>
#include <sys/types.h>

#define KERNEL_VERSION_MAJOR 0
#define KERNEL_VERSION_MINOR 1
#define KERNEL_VERSION_PATCH 0
#define KERNEL_VERSION_STRING "0.1.0"

#define MAX_PROCESSES 1024
#define MAX_PROCESS_NAME 256
#define MAX_PATH_LENGTH 4096
#define DEFAULT_GRPC_PORT 50051
#define CGROUP_ROOT "/sys/fs/cgroup"

/* Error codes */
typedef enum
{
    NW_SUCCESS = 0,
    NW_ERROR_GENERAL = -1,
    NW_ERROR_INVALID_PARAM = -2,
    NW_ERROR_NO_MEMORY = -3,
    NW_ERROR_PROCESS_FAILED = -4,
    NW_ERROR_CGROUP_FAILED = -5,
    NW_ERROR_NOT_FOUND = -6,
    NW_ERROR_PERMISSION_DENIED = -7,
    NW_ERROR_ALREADY_EXISTS = -8,
    NW_ERROR_TIMEOUT = -9,
    NW_ERROR_IO = -10
} nw_error_t;

/* Process states */
typedef enum
{
    PROCESS_STATE_INIT = 0,
    PROCESS_STATE_RUNNING,
    PROCESS_STATE_STOPPED,
    PROCESS_STATE_FAILED,
    PROCESS_STATE_TERMINATED
} process_state_t;

/* Resource limits */
typedef struct
{
    uint64_t memory_bytes;  /* Memory limit in bytes */
    uint32_t cpu_shares;    /* CPU shares (relative weight) */
    uint32_t cpu_quota_us;  /* CPU quota in microseconds per period */
    uint32_t cpu_period_us; /* CPU period in microseconds */
    uint32_t pids_limit;    /* Maximum number of PIDs */
} resource_limits_t;

/* Process information */
typedef struct
{
    char id[64];                       /* Unique process ID */
    char name[MAX_PROCESS_NAME];       /* Process name */
    pid_t pid;                         /* System process ID */
    process_state_t state;             /* Current state */
    char command[MAX_PATH_LENGTH];     /* Command to execute */
    char working_dir[MAX_PATH_LENGTH]; /* Working directory */
    resource_limits_t limits;          /* Resource limits */
    time_t start_time;                 /* Process start time */
    uid_t uid;                         /* User ID */
    gid_t gid;                         /* Group ID */
} process_info_t;

/* Kernel configuration */
typedef struct
{
    uint16_t grpc_port;                /* gRPC server port */
    char log_level[32];                /* Logging level */
    char cgroup_root[MAX_PATH_LENGTH]; /* cgroup root path */
    bool enable_metrics;               /* Enable metrics collection */
    uint32_t metrics_interval_sec;     /* Metrics collection interval */
} kernel_config_t;

/* Process manager interface */
typedef struct process_manager process_manager_t;

/* Initialize process manager */
nw_error_t pm_init(process_manager_t **pm, const kernel_config_t *config);

/* Cleanup process manager */
void pm_cleanup(process_manager_t *pm);

/* Start a new process */
nw_error_t pm_start_process(process_manager_t *pm, const process_info_t *info);

/* Stop a process */
nw_error_t pm_stop_process(process_manager_t *pm, const char *process_id);

/* Get process information */
nw_error_t pm_get_process(process_manager_t *pm, const char *process_id, process_info_t *info);

/* List all processes */
nw_error_t pm_list_processes(process_manager_t *pm, process_info_t **list, size_t *count);

/* Update resource limits */
nw_error_t pm_update_limits(process_manager_t *pm, const char *process_id, const resource_limits_t *limits);

/* cgroup manager interface */
typedef struct cgroup_manager cgroup_manager_t;

/* Initalize cgroup manager */
nw_error_t cg_init(cgroup_manager_t **cg, const char *cgroup_root);

/* Cleanup cgroup manager */
void cg_cleanup(cgroup_manager_t *cg);

/* Create cgroup for process */
nw_error_t cg_create_group(cgroup_manager_t *cg, const char *group_name);

/* Remove group */
nw_error_t cg_remove_group(cgroup_manager_t *cg, const char *group_name);

/* Apply resource limits */
nw_error_t cg_apply_limits(cgroup_manager_t *cg, const char *group_name, const resource_limits_t *limits);

/* Add process to cgroup */
nw_error_t cg_add_process(cgroup_manager_t *cg, const char *group_name, pid_t pid);

/* Utility functions */
const char *nw_error_string(nw_error_t error);
void nw_log_init(const char *log_level);
void nw_log(const char *level, const char *format, ...);

#endif /* NEXUS_WEAVER_KERNEL_H */
