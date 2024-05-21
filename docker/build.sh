#!/bin/bash
# Builds the Docker image.
# Usage:
#   ./docker/build.sh

set -e

# Checks that the home directory is the root of the project.
if [[ ! -f "store/requirements.txt" ]]; then
  echo "Error: Please run this script from the root of the project."
  exit 1
fi

# Builds the API Docker image.
docker buildx build --platform linux/amd64 -t kscale-store -f docker/Dockerfile .
