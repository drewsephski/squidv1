#!/usr/bin/env python3
import argparse
import os
import subprocess
import signal
import socket
import sys
import time


def is_port_open(host, port, timeout=1.0):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False


def wait_for_port(host, port, timeout=30):
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_open(host, port):
            return True
        time.sleep(0.5)
    return False


def run_server(command, port, host="localhost"):
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=None if sys.platform == "win32" else os.setsid,
    )
    return process


def main():
    parser = argparse.ArgumentParser(description="Manage server lifecycle")
    parser.add_argument("--server", action="append", nargs=2, metavar=("CMD", "PORT"))
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("automation_script", nargs=argparse.REMAINDER)

    args = parser.parse_args()

    if not args.server:
        parser.error("At least one --server required")

    if not args.automation_script:
        parser.error("Automation script required")

    servers = []
    processes = []

    try:
        # Start all servers
        for server_cmd, port_str in args.server:
            port = int(port_str)
            print(f"Starting server: {server_cmd} on port {port}")
            process = run_server(server_cmd, port, args.host)
            processes.append((process, port))
            servers.append((server_cmd, port))

        # Wait for all servers to be ready
        print("Waiting for servers to start...")
        all_ready = True
        for _, port in servers:
            if not wait_for_port(args.host, port, args.timeout):
                print(f"Timeout waiting for port {port}")
                all_ready = False
                break

        if not all_ready:
            print("Not all servers started successfully")
            sys.exit(1)

        print("All servers are ready!")

        # Run the automation script
        automation_args = [arg for arg in args.automation_script if arg != "--"]
        automation_cmd = " ".join(automation_args)
        print(f"Running automation script: {automation_cmd}")
        result = subprocess.run(automation_cmd, shell=True)

        # Exit with the automation script's return code
        sys.exit(result.returncode)

    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(1)

    finally:
        # Cleanup: terminate all server processes
        for process, port in processes:
            try:
                if sys.platform == "win32":
                    process.terminate()
                else:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                print(f"Terminated server on port {port}")
            except Exception as e:
                print(f"Error terminating process: {e}")


if __name__ == "__main__":
    main()
