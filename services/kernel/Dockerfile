# Nexus Weaver Kernel - Production Dockerfile
FROM ubuntu:22.04 AS builder 

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    make \
    pkg-config \
    libprotobuf-c-dev \
    protobuf-c-compiler \
    libgrpc-dev \
    libgrpc++-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build 

# Copy source files 
COPY Makefile ./
COPY include/ ./include/
COPY src/ ./src/

# Build the kernel 
RUN make release 

# Runtime stage 
FROM ubuntu:22.04 

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libprotobuf-c1 \
    libgrpc10 \
    libgrpc++1 \
    && rm -rf /var/lib/apt/lists/* 

# Create non root user
RUN useradd -m -s /bin/bash nexus 

# Copy the built binary
COPY --from=builder /build/build/kernel /usr/local/bin/kernel 

# Set up directories
RUN mkdir -p /var/log/nexus-weaver && \
    chown -R nexus:nexus /var/log/nexus-weaver 

# Expose gRPC port
EXPOSE 50051

# Set entrypoint
ENTRYPOINT [ "/usr/local/bin/kernel" ]
CMD [ "--port", "50051", "--log-level", "info" ]
