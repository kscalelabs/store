#!/bin/bash

set -e
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Frontend build complete."
cd ..
