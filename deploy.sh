#!/bin/bash

set -e  # Exit on error

# Set default mode to production
IMAGE_NAME="keerat_backend"
PORT=3002

docker ps -a -q --filter "name=$IMAGE_NAME" | xargs docker stop
docker ps -a -q --filter "name=$IMAGE_NAME" | xargs docker rm

# Build image
echo "🔨 Building Docker image for $MODE..."
docker build --target "$MODE" -t "$IMAGE_NAME" .

# Run container
echo "🚀 Running container from $IMAGE_NAME..."
docker run -d -p $PORT:$PORT --name "$IMAGE_NAME" "$IMAGE_NAME"
