#!/usr/bin/env python3
"""
Simple test client for Nexus Weaver Kernel
"""

import socket
import struct
import sys

# Message types
MSG_START_PROCESS = 1
MSG_STOP_PROCESS = 2
MSG_GET_PROCESS = 3
MSG_LIST_PROCESSES = 4
MSG_HEALTH_CHECK = 5

def send_message(sock, msg_type, data=""):
    """Send a message to the kernel server"""
    # Pack message: type (4 bytes) + length (4 bytes) + data
    data_bytes = data.encode('utf-8')
    msg = struct.pack('<II', msg_type, len(data_bytes)) + data_bytes
    sock.sendall(msg)
    
    # Receive response
    header = sock.recv(8)
    if len(header) < 8:
        return None
    
    resp_type, resp_len = struct.unpack('<II', header)
    resp_data = sock.recv(resp_len) if resp_len > 0 else b""
    
    return resp_data.decode('utf-8')

def main():
    if len(sys.argv) < 2:
        print("Usage: test_client.py <command> [args...]")
        print("Commands:")
        print("  health    - Check kernel health")
        print("  list      - List all processes")
        print("  start     - Start a process (id name command)")
        print("  stop      - Stop a process (id)")
        return
    
    # Connect to kernel
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.connect(('localhost', 50051))
        
        command = sys.argv[1]
        
        if command == "health":
            resp = send_message(sock, MSG_HEALTH_CHECK)
            print(f"Health check: {resp}")
            
        elif command == "list":
            resp = send_message(sock, MSG_LIST_PROCESSES)
            print(f"Processes:\n{resp}")
            
        elif command == "start" and len(sys.argv) >= 5:
            process_data = f"{sys.argv[2]} {sys.argv[3]} {' '.join(sys.argv[4:])}"
            resp = send_message(sock, MSG_START_PROCESS, process_data)
            print(f"Start process: {resp}")
            
        elif command == "stop" and len(sys.argv) >= 3:
            resp = send_message(sock, MSG_STOP_PROCESS, sys.argv[2])
            print(f"Stop process: {resp}")
            
        else:
            print("Invalid command or missing arguments")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    main()