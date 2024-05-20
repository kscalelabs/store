#!/bin/bash
# Runs the Docker image.
# Usage:
#   ./docker/run.sh

# Exposes port 80 on the container to port 8080 on the host.
# Visible at http://localhost:8080
docker run -p 8080:80 kscale-store:latest
