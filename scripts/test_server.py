#!/usr/bin/env python3
import argparse


def main():
    parser = argparse.ArgumentParser(description="Manage server lifecycle")
    parser.add_argument("--server", action="append", nargs=2, metavar=("CMD", "PORT"))
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("script", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if not args.server:
        parser.error("At least one --server required")
    if not args.script:
        parser.error("Script required")
    print(f"Servers: {args.server}")
    print(f"Script: {args.script}")
    print(f"Host: {args.host}, Timeout: {args.timeout}")


if __name__ == "__main__":
    main()
