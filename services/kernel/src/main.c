/*
 * Nexus Weaver Kernel
 * Copyright (c) 2024 Nexus Weaver Project
 * 
 * File: main.c
 * Description: Entry point for the Nexus Weaver kernel
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>
#include <getopt.h>
#include <errno.h>

#include "kernel.h"
#include "grpc_server.h"
#include "process_manager.h"
#include "cgroup_manager.h"

/* Global variables for signal handling */
static volatile sig_atomic_t g_running = 1;
static process_manager_t *g_process_manager = NULL;
static grpc_server_t *g_grpc_server = NULL;

/* Signal handler for graceful shutdown */
static void signal_handler(int sig) {
    if (sig == SIGINT || sig == SIGTERM) {
        nw_log("INFO", "Received signal %d, shutting down...", sig);
        g_running = 0;
    }
}

/* Setup signal handlers */
static void setup_signals(void) {
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = signal_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;

    if (sigaction(SIGINT, &sa, NULL) < 0) {
        nw_log("ERROR", "Failed to set SIGINT handler: %s", strerror(errno));
    }
    if (sigaction(SIGTERM, &sa, NULL) < 0) {
        nw_log("ERROR", "Failed to set SIGTERM handler: %s", strerror(errno));
    }

    /* Ignore SIGPIPE for network operations */
    signal(SIGPIPE, SIG_IGN);
}

/* Print usage information */
static void print_usage(const char *prog_name) {
    printf("Usage: %s [OPTIONS]\n", prog_name);
    printf("\nOptions:\n");
    printf("  -p, --port PORT          gRPC server port (default: %d)\n", DEFAULT_GRPC_PORT);
    printf("  -l, --log-level LEVEL    Log level: debug, info, warn, error (default: info)\n");
    printf("  -c, --cgroup-root PATH   cgroup root path (default: %s)\n", CGROUP_ROOT);
    printf("  -m, --metrics            Enable metrics collection\n");
    printf("  -d, --dev-mode           Enable development mode (relaxed security)\n");
    printf("  -v, --version            Show version information\n");
    printf("  -h, --help               Show this help message\n");
}

/* Parse command line arguments */
static int parse_arguments(int argc, char *argv[], kernel_config_t *config) {
    static struct option long_options[] = {
        {"port", required_argument, 0, 'p'},
        {"log-level", required_argument, 0, 'l'},
        {"cgroup-root", required_argument, 0, 'c'},
        {"metrics", no_argument, 0, 'm'},
        {"dev-mode", no_argument, 0, 'd'},
        {"version", no_argument, 0, 'v'},
        {"help", no_argument, 0, 'h'},
        {0, 0, 0, 0}
    };

    int opt;
    int option_index = 0;

    /* Set defaults */
    config->grpc_port = DEFAULT_GRPC_PORT;
    strcpy(config->log_level, "info");
    strcpy(config->cgroup_root, CGROUP_ROOT);
    config->enable_metrics = false;
    config->metrics_interval_sec = 30;

    while ((opt = getopt_long(argc, argv, "p:l:c:mdvh", long_options, &option_index)) != -1) {
        switch (opt) {
            case 'p':
                config->grpc_port = (uint16_t)atoi(optarg);
                if (config->grpc_port == 0) {
                    fprintf(stderr, "Invalid port number: %s\n", optarg);
                    return -1;
                }
                break;

            case 'l':
                strncpy(config->log_level, optarg, sizeof(config->log_level) - 1);
                config->log_level[sizeof(config->log_level) - 1] = '\0';
                break;

            case 'c':
                strncpy(config->cgroup_root, optarg, sizeof(config->cgroup_root) - 1);
                config->cgroup_root[sizeof(config->cgroup_root) - 1] = '\0';
                break;

            case 'm':
                config->enable_metrics = true;
                break;

            case 'd':
                nw_log("WARN", "Development mode enabled - security checks relaxed");
                break;

            case 'v':
                printf("Nexus Weaver Kernel v%s\n", KERNEL_VERSION_STRING);
                printf("Build: %s %s\n", __DATE__, __TIME__);
                return 1;

            case 'h':
                print_usage(argv[0]);
                return 1;

            default:
                print_usage(argv[0]);
                return -1;
        }
    }

    return 0;
}

/* Initialize kernel components */
static nw_error_t initialize_kernel(const kernel_config_t *config) {
    nw_error_t err;

    /* Initialize logging */
    nw_log_init(config->log_level);
    nw_log("INFO", "Starting Nexus Weaver Kernel v%s", KERNEL_VERSION_STRING);

    /* Check if running as root (required for cgroups) */
    if (geteuid() != 0) {
        nw_log("WARN", "Not running as root - some features may be limited");
    }

    /* Initialize cgroup manager */
    cgroup_manager_t *cgroup_mgr;
    err = cg_init(&cgroup_mgr, config->cgroup_root);
    if (err != NW_SUCCESS) {
        nw_log("ERROR", "Failed to initialize cgroup manager: %s", nw_error_string(err));
        return err;
    }

    /* Initialize process manager */
    err = pm_init(&g_process_manager, config);
    if (err != NW_SUCCESS) {
        nw_log("ERROR", "Failed to initialize process manager: %s", nw_error_string(err));
        cg_cleanup(cgroup_mgr);
        return err;
    }

    /* Set cgroup manager in process manager */
    pm_set_cgroup_manager(g_process_manager, cgroup_mgr);

    /* Initialize gRPC server */
    err = grpc_server_init(&g_grpc_server, config->grpc_port, g_process_manager);
    if (err != NW_SUCCESS) {
        nw_log("ERROR", "Failed to initialize gRPC server: %s", nw_error_string(err));
        pm_cleanup(g_process_manager);
        cg_cleanup(cgroup_mgr);
        return err;
    }

    nw_log("INFO", "Kernel initialized successfully");
    return NW_SUCCESS;
}

/* Main event loop */
static void run_event_loop(void) {
    nw_log("INFO", "Kernel ready and waiting for requests");

    while (g_running) {
        /* Process manager housekeeping */
        pm_check_processes(g_process_manager);

        /* Sleep briefly to avoid busy-waiting */
        usleep(100000); /* 100ms */
    }
}

/* Cleanup kernel components */
static void cleanup_kernel(void) {
    nw_log("INFO", "Cleaning up kernel components...");

    if (g_grpc_server) {
        grpc_server_stop(g_grpc_server);
        grpc_server_cleanup(g_grpc_server);
    }

    if (g_process_manager) {
        /* Stop all managed processes */
        pm_stop_all_processes(g_process_manager);
        
        /* Get cgroup manager before cleanup */
        cgroup_manager_t *cgroup_mgr = pm_get_cgroup_manager(g_process_manager);
        
        /* Cleanup process manager */
        pm_cleanup(g_process_manager);
        
        /* Cleanup cgroup manager */
        if (cgroup_mgr) {
            cg_cleanup(cgroup_mgr);
        }
    }

    nw_log("INFO", "Kernel shutdown complete");
}

int main(int argc, char *argv[]) {
    kernel_config_t config;
    int ret;

    /* Parse command line arguments */
    ret = parse_arguments(argc, argv, &config);
    if (ret < 0) {
        return EXIT_FAILURE;
    } else if (ret > 0) {
        return EXIT_SUCCESS;
    }

    /* Setup signal handlers */
    setup_signals();

    /* Initialize kernel components */
    if (initialize_kernel(&config) != NW_SUCCESS) {
        return EXIT_FAILURE;
    }

    /* Start gRPC server */
    if (grpc_server_start(g_grpc_server) != NW_SUCCESS) {
        cleanup_kernel();
        return EXIT_FAILURE;
    }

    /* Run main event loop */
    run_event_loop();

    /* Cleanup and exit */
    cleanup_kernel();
    return EXIT_SUCCESS;
}