/*
 * Nexus Weaver Kernel
 * Copyright (c) 2025 Nexus Weaver Project
 *
 * File: utils.c
 * Description: Utility functions implementation
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <time.h>
#include <unistd.h>
#include <pthread.h>

#include "kernel.h"

/* Log level definitions */
typedef enum
{
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO,
    LOG_LEVEL_WARN,
    LOG_LEVEL_ERROR
} log_level_t;

/* Gloval log config */
static log_level_t g_log_level = LOG_LEVEL_INFO;
static pthread_mutex_t g_log_mutex = PTHREAD_MUTEX_INITIALIZER;

/* Error strings */
static const char *error_strings[] = {
    [0] = "Success",
    [-NW_ERROR_GENERAL] = "General error",
    [-NW_ERROR_INVALID_PARAM] = "Invalid parameter",
    [-NW_ERROR_NO_MEMORY] = "Out of memory",
    [-NW_ERROR_PROCESS_FAILED] = "Process operation failed",
    [-NW_ERROR_CGROUP_FAILED] = "cgroup operation failed",
    [-NW_ERROR_NOT_FOUND] = "Not found",
    [-NW_ERROR_PERMISSION_DENIED] = "Permission denied",
    [-NW_ERROR_ALREADY_EXISTS] = "Already exists",
    [-NW_ERROR_TIMEOUT] = "Operation timed out",
    [-NW_ERROR_IO] = "I/O error"};

/* Get error string */
const char *nw_error_string(nw_error_t error)
{
    int index = -error;
    if (index >= 0 && index < (int)(sizeof(error_strings) / sizeof(error_strings[0])))
    {
        return error_strings[index];
    }
    return "Unknown error";
}

/* Parse log level from string */
static log_level_t parse_log_level(const char *level)
{
    if (!level)
    {
        return LOG_LEVEL_INFO;
    }

    if (strcasecmp(level, "debug") == 0)
    {
        return LOG_LEVEL_DEBUG;
    }
    else if (strcasecmp(level, "info") == 0)
    {
        return LOG_LEVEL_INFO;
    }
    else if (strcasecmp(level, "warn") == 0)
    {
        return LOG_LEVEL_WARN;
    }
    else if (strcasecmp(level, "error") == 0)
    {
        return LOG_LEVEL_ERROR;
    }

    return LOG_LEVEL_INFO;
}

/* Get log level string */
static const char *log_level_string(log_level_t level)
{
    switch (level)
    {
    case LOG_LEVEL_DEBUG:
        return "DEBUG";
    case LOG_LEVEL_INFO:
        return "INFO";
    case LOG_LEVEL_WARN:
        return "WARN";
    case LOG_LEVEL_ERROR:
        return "ERROR";
    default:
        return "UNKNOWN";
    }
}

/* Initialize logging */
void nw_log_init(const char *log_level)
{
    g_log_level = parse_log_level(log_level);
}

/* Log message */
void nw_log(const char *level, const char *format, ...)
{
    log_level_t msg_level = parse_log_level(level);

    if (msg_level < g_log_level)
    {
        return;
    }

    time_t now;
    struct tm *tm_info;
    char time_buf[32];

    time(&now);
    tm_info = localtime(&now);
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%H:%S", tm_info);

    char msg_buf[4096];
    va_list args;
    va_start(args, format);
    vsnprintf(msg_buf, sizeof(msg_buf), format, args);
    va_end(args);

    pthread_mutex_lock(&g_log_mutex);
    fprintf(stderr, "[%s] [%s] [%d] %s\n", time_buf, log_level_string(msg_level), getpid(), msg_buf);
    fflush(stderr);
    pthread_mutex_unlock(&g_log_mutex);
}