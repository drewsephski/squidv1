import argparse


def main():
    parser = argparse.ArgumentParser(description="test")
    parser.add_argument("--help", action="store_true")
    args = parser.parse_args()
    print("Parsed successfully")


if __name__ == "__main__":
    main()
