from pathlib import Path
import json
import argparse

_HERE = Path(__file__).parent

_ALLOWED_EXTENSIONS = [".xml", ".png", ".stl", ".STL", ".obj"]

def main(ignored_extensions):
    files_to_download = []
    for path in _HERE.rglob("*"):
        if path.is_file() and path.suffix in _ALLOWED_EXTENSIONS and path.suffix not in ignored_extensions:
            files_to_download.append(str(path.relative_to(_HERE)))
    files_to_download.sort()
    index_file_path = _HERE / "index.json"
    with open(index_file_path, mode="w") as f:
        json.dump(files_to_download, f, indent=2)
        
    print(f"File written to: {index_file_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate index.json for allowed files, ignoring specified extensions.')
    parser.add_argument('--ignore', nargs='*', default=[], help='List of file extensions to ignore')
    args = parser.parse_args()

    main(args.ignore)