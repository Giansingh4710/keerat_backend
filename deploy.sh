#!/bin/bash

set -e  # Exit on error

./upload_data.sh
# Set default mode to production
IMAGE_NAME="keerat_backend"
PORT=3002

CONTAINER_IDS=$(docker ps -a -q --filter "name=$IMAGE_NAME")
if [ -n "$CONTAINER_IDS" ]; then
  echo "🛑 Stopping existing container(s)..."
  docker stop $CONTAINER_IDS
  echo "🗑️ Removing existing container(s)..."
  docker rm $CONTAINER_IDS
else
  echo "✅ No existing containers to stop/remove."
fi

# Build image
echo "🔨 Building Docker image for $MODE..."
docker build --target "$MODE" -t "$IMAGE_NAME" .

# Run container
echo "🚀 Running container from $IMAGE_NAME..."
docker run -d -p $PORT:$PORT --name "$IMAGE_NAME" "$IMAGE_NAME"
