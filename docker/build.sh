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
docker build -t kscale-store -f docker/Dockerfile .

# Log in to ECR.
# aws ecr get-login-password | docker login --username AWS --password-stdin ${WIKIBOT_ECR_URI}

# Pushes the Docker image to ECR.
# docker tag kscale-store:latest ${WIKIBOT_ECR_URI}:latest
# docker push ${WIKIBOT_ECR_URI}:latest

# Runs the Docker image locally.
# docker run kscale-store:latest
