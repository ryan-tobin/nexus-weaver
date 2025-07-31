#!/usr/bin/env python3

import socket
import struct
import sys

def send_message(host, port, message_type, data):
    """Send a message using the legacy TCP protocol"""
    try:
        # Connect to server
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((host, port))
        
        # Prepare message
        data_bytes = data.encode('utf-8')
        
        # Send header (8 bytes: 4 for type, 4 for length)
        header = struct.pack('<II', message_type, len(data_bytes))
        sock.send(header)
        
        # Send data
        if data_bytes:
            sock.send(data_bytes)
        
        print(f"Sent: type={message_type}, data='{data}'")
        
        # Read response header
        response_header = sock.recv(8)
        if len(response_header) != 8:
            print("Failed to read response header")
            return
            
        response_type, response_length = struct.unpack('<II', response_header)
        
        # Read response data
        response_data = b""
        if response_length > 0:
            response_data = sock.recv(response_length)
            
        response_text = response_data.decode('utf-8')
        print(f"Response: type={response_type}, data='{response_text}'")
        
        sock.close()
        return response_text
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    host = "35.185.97.188"  # VM external IP
    port = 50051
    
    print("Testing Go Kernel TCP Protocol")
    print(f"Connecting to {host}:{port}")
    
    # Test health check (message type 5)
    print("\n1. Health Check:")
    send_message(host, port, 5, "")
    
    # Test start process (message type 1)
    print("\n2. Start Process:")
    send_message(host, port, 1, "test123 hello-python python app.py")
    
    # Test list processes (message type 4)
    print("\n3. List Processes:")
    send_message(host, port, 4, "")
    
    # Test stop process (message type 2)
    print("\n4. Stop Process:")
    send_message(host, port, 2, "test123")

if __name__ == "__main__":
    main()