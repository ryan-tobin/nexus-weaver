/**
 * Nexus Weaver Kernel
 * Copyright (c) 2025 Nexus Weaver Project
 *
 * File: process_manager.h
 * Description: Process management interface
 */

#ifndef NEXUS_WEAVER_PROCESS_MANAGER_H
#define NEXUS_WEAVER_PROCESS_MANAGER_H

#include "kernel.h"
#include "cgroup_manager.h"

/* Process manager structure (opaque) */
typedef struct process_manager process_manager_t;

/* Additional process manager functions not in kernel.h */

/* Set cgroup manager */
void pm_set_cgroup_manager(process_manager_t *pm, cgroup_manager_t *cg);

/* Get cgroup manager */
cgroup_manager_t *pm_get_cgroup_manager(process_manager_t *pm);

/* Stop all processes */
nw_error_t pm_stop_all_processes(process_manager_t *pm);

/* Check process states and cleanup terminated processes */
void pm_check_processes(process_manager_t *pm);

/* Get process statistics */
typedef struct
{
    uint64_t memory_current;  /* Current memory usage in bytes */
    uint64_t memory_peak;     /* Peak memory usage in bytes */
    double cpu_usage_percent; /* CPU usage percentage */
    uint64_t io_read_bytes;   /* Bytes read */
    uint64_t io_write_bytes;  /* Bytes written */
} process_stats_t;

nw_error_t pm_get_process_stats(process_manager_t *pm, const char *process_id, process_stats_t *stats);

/* Process event callbacks */
typedef void (*process_event_cb)(const char *process_id, process_state_t old_state, process_state_t new_state, void *user_data);

/* Register process state change callback */
void pm_register_event_callback(process_manager_t *pm, process_event_cb callback, void *user_data);

#endif /* NEXUS_WEAVER_PROCESS_MANAGER_H */
