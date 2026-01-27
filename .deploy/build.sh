#!/bin/bash
set -e

echo "Building application..."
npm run build

echo "Copying config.yaml to dist..."
cp config.yaml dist/config.yaml

echo "Build complete!"
