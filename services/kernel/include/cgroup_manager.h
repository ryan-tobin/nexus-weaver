/*
 * Nexus Weaver Kernel
 * Copyright (c) 2025 Nexus Weaver Project
 *
 * File: cgroup_manager.h
 * Description: cgroup v2 management interface
 */

#ifndef NEXUS_WEAVER_CGROUP_MANAGER_H
#define NEXUS_WEAVER_CGROUP_MANAGER_H

#include "kernel.h"

/* cgroup manager structure (opaque) */
typedef struct cgroup_manager cgroup_manager_t;

/* cgroup statistics */
typedef struct
{
    uint64_t memory_current; /* Current memory usage */
    uint64_t memory_max;     /* Maximum memory usage */
    uint64_t cpu_usage_usec; /* Total CPU usage in microseconds */
    uint32_t nr_periods;     /* Number of CPU periods */
    uint32_t nr_throttled;   /* Number of throttled periods */
    uint64_t throttled_usec; /* Total throttled time */
} cgroup_stats_t;

/* Get cgroup statistics */
nw_error_t cg_get_stats(cgroup_manager_t *cg, const char *group_name,
                        cgroup_stats_t *stats);

/* Check if cgroups v2 is available */
bool cg_is_v2_available(void);

#endif /* NEXUS_WEAVER_CGROUP_MANAGER_H */