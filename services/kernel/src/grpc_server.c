/*
 * Nexus Weaver Kernel
 * Copyright (c) 2024 Nexus Weaver Project
 * 
 * File: grpc_server.c
 * Description: gRPC server implementation
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <unistd.h>
#include <signal.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdbool.h>

#include "kernel.h"
#include "grpc_server.h"
#include "process_manager.h"

/* For now, we'll implement a simple TCP server that can be extended to gRPC later */

/* gRPC server structure */
struct grpc_server {
    uint16_t port;
    process_manager_t *process_manager;
    int server_fd;
    pthread_t server_thread;
    volatile bool running;
    char server_address[256];
};

/* Simple message protocol for testing */
typedef enum {
    MSG_START_PROCESS = 1,
    MSG_STOP_PROCESS = 2,
    MSG_GET_PROCESS = 3,
    MSG_LIST_PROCESSES = 4,
    MSG_HEALTH_CHECK = 5
} message_type_t;

typedef struct {
    message_type_t type;
    uint32_t length;
    char data[4096];
} message_t;

/* Forward declarations */
static void* grpc_server_thread(void *arg);
static void handle_client_connection(grpc_server_t *server, int client_fd);
static void handle_message(grpc_server_t *server, int client_fd, const message_t *msg);

/* Initialize gRPC server */
nw_error_t grpc_server_init(grpc_server_t **server, uint16_t port, process_manager_t *pm) {
    if (!server || !pm) {
        return NW_ERROR_INVALID_PARAM;
    }
    
    *server = calloc(1, sizeof(grpc_server_t));
    if (!*server) {
        return NW_ERROR_NO_MEMORY;
    }
    
    (*server)->port = port;
    (*server)->process_manager = pm;
    (*server)->running = false;
    (*server)->server_fd = -1;
    
    /* Format server address */
    snprintf((*server)->server_address, sizeof((*server)->server_address), 
             "0.0.0.0:%d", port);
    
    nw_log("INFO", "gRPC server initialized on %s", (*server)->server_address);
    return NW_SUCCESS;
}

/* Start gRPC server */
nw_error_t grpc_server_start(grpc_server_t *server) {
    if (!server) {
        return NW_ERROR_INVALID_PARAM;
    }
    
    if (server->running) {
        return NW_ERROR_ALREADY_EXISTS;
    }
    
    /* Create socket */
    server->server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server->server_fd < 0) {
        nw_log("ERROR", "Failed to create socket: %s", strerror(errno));
        return NW_ERROR_IO;
    }
    
    /* Allow socket reuse */
    int opt = 1;
    if (setsockopt(server->server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        nw_log("WARN", "Failed to set SO_REUSEADDR: %s", strerror(errno));
    }
    
    /* Bind to address */
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(server->port);
    
    if (bind(server->server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        nw_log("ERROR", "Failed to bind to port %d: %s", server->port, strerror(errno));
        close(server->server_fd);
        server->server_fd = -1;
        return NW_ERROR_IO;
    }
    
    /* Listen for connections */
    if (listen(server->server_fd, 10) < 0) {
        nw_log("ERROR", "Failed to listen on socket: %s", strerror(errno));
        close(server->server_fd);
        server->server_fd = -1;
        return NW_ERROR_IO;
    }
    
    server->running = true;
    
    /* Create server thread */
    if (pthread_create(&server->server_thread, NULL, grpc_server_thread, server) != 0) {
        server->running = false;
        close(server->server_fd);
        server->server_fd = -1;
        return NW_ERROR_GENERAL;
    }
    
    nw_log("INFO", "gRPC server started on %s", server->server_address);
    return NW_SUCCESS;
}

/* Stop gRPC server */
void grpc_server_stop(grpc_server_t *server) {
    if (!server || !server->running) {
        return;
    }
    
    nw_log("INFO", "Stopping gRPC server...");
    server->running = false;
    
    /* Close server socket to interrupt accept() */
    if (server->server_fd >= 0) {
        shutdown(server->server_fd, SHUT_RDWR);
        close(server->server_fd);
        server->server_fd = -1;
    }
    
    /* Wait for server thread to exit */
    pthread_join(server->server_thread, NULL);
    
    nw_log("INFO", "gRPC server stopped");
}

/* Cleanup gRPC server */
void grpc_server_cleanup(grpc_server_t *server) {
    if (!server) {
        return;
    }
    
    if (server->running) {
        grpc_server_stop(server);
    }
    
    free(server);
}

/* Server thread function */
static void* grpc_server_thread(void *arg) {
    grpc_server_t *server = (grpc_server_t *)arg;
    
    while (server->running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        
        /* Accept client connection */
        int client_fd = accept(server->server_fd, (struct sockaddr *)&client_addr, &client_len);
        if (client_fd < 0) {
            if (server->running && errno != EINTR) {
                nw_log("ERROR", "Failed to accept connection: %s", strerror(errno));
            }
            continue;
        }
        
        /* Handle client in the same thread (for simplicity) */
        /* In production, this would spawn a new thread or use epoll */
        handle_client_connection(server, client_fd);
        
        close(client_fd);
    }
    
    return NULL;
}

/* Handle client connection */
static void handle_client_connection(grpc_server_t *server, int client_fd) {
    message_t msg;
    ssize_t bytes_read;
    
    /* Read message header */
    bytes_read = recv(client_fd, &msg, sizeof(msg.type) + sizeof(msg.length), MSG_WAITALL);
    if (bytes_read <= 0) {
        return;
    }
    
    /* Validate message length */
    if (msg.length > sizeof(msg.data)) {
        nw_log("ERROR", "Message too large: %u bytes", msg.length);
        return;
    }
    
    /* Read message data */
    if (msg.length > 0) {
        bytes_read = recv(client_fd, msg.data, msg.length, MSG_WAITALL);
        if (bytes_read != (ssize_t)msg.length) {
            nw_log("ERROR", "Failed to read complete message");
            return;
        }
    }
    
    /* Handle the message */
    handle_message(server, client_fd, &msg);
}

/* Handle incoming message */
static void handle_message(grpc_server_t *server, int client_fd, const message_t *msg) {
    message_t response;
    memset(&response, 0, sizeof(response));
    
    switch (msg->type) {
        case MSG_HEALTH_CHECK:
            response.type = MSG_HEALTH_CHECK;
            snprintf(response.data, sizeof(response.data), 
                     "OK - Kernel v%s", KERNEL_VERSION_STRING);
            response.length = strlen(response.data);
            break;
            
        case MSG_LIST_PROCESSES: {
            process_info_t *list;
            size_t count;
            
            if (pm_list_processes(server->process_manager, &list, &count) == NW_SUCCESS) {
                response.type = MSG_LIST_PROCESSES;
                response.length = snprintf(response.data, sizeof(response.data), 
                                         "Process count: %zu\n", count);
                
                for (size_t i = 0; i < count && response.length < sizeof(response.data) - 100; i++) {
                    response.length += snprintf(response.data + response.length, 
                                              sizeof(response.data) - response.length,
                                              "- %s (PID: %d, State: %d)\n", 
                                              list[i].name, list[i].pid, list[i].state);
                }
                
                free(list);
            }
            break;
        }
            
        case MSG_START_PROCESS: {
            /* Parse process info from message data */
            process_info_t info;
            memset(&info, 0, sizeof(info));
            
            /* Simple parsing - in real implementation, this would use protobuf */
            if (sscanf(msg->data, "%63s %255s %4095s", 
                      info.id, info.name, info.command) == 3) {
                
                info.state = PROCESS_STATE_INIT;
                info.limits.memory_bytes = 512 * 1024 * 1024; /* 512MB default */
                info.limits.cpu_shares = 1024;
                
                nw_error_t err = pm_start_process(server->process_manager, &info);
                
                response.type = MSG_START_PROCESS;
                if (err == NW_SUCCESS) {
                    response.length = snprintf(response.data, sizeof(response.data),
                                             "Process started: %s", info.id);
                } else {
                    response.length = snprintf(response.data, sizeof(response.data),
                                             "Error: %s", nw_error_string(err));
                }
            }
            break;
        }
            
        case MSG_STOP_PROCESS: {
            char process_id[64];
            if (sscanf(msg->data, "%63s", process_id) == 1) {
                nw_error_t err = pm_stop_process(server->process_manager, process_id);
                
                response.type = MSG_STOP_PROCESS;
                if (err == NW_SUCCESS) {
                    response.length = snprintf(response.data, sizeof(response.data),
                                             "Process stopped: %s", process_id);
                } else {
                    response.length = snprintf(response.data, sizeof(response.data),
                                             "Error: %s", nw_error_string(err));
                }
            }
            break;
        }
            
        default:
            response.type = msg->type;
            response.length = snprintf(response.data, sizeof(response.data), 
                                     "Unknown message type: %d", msg->type);
            break;
    }
    
    /* Send response */
    send(client_fd, &response, sizeof(response.type) + sizeof(response.length) + response.length, 0);
}