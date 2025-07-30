/*
 * Nexus Weaver Kernel
 * Copyright (c) 2025 Nexus Weaver Project
 *
 * File: grpc_server.h
 * Description: gRPC server interface
 */

#ifndef NEXUS_WEAVER_GRPC_SERVER_H
#define NEXUS_WEAVER_GRPC_SERVER_H

#include "kernel.h"
#include "process_manager.h"

/* gRPC server structure */
typedef struct grpc_server grpc_server_t;

/* Init gRPC server */
nw_error_t grpc_server_init(grpc_server_t **server, uint16_t port, process_manager_t *pm);

/* Start gRPC server */
nw_error_t grpc_server_start(grpc_server_t *server);

/* Stop gRPC server */
void grpc_server_stop(grpc_server_t *server);

/* Cleanup gRPC server */
void grpc_server_cleanup(grpc_server_t *server);

#endif /* NEXUS_WEAVER_GRPC_SERVER_H */