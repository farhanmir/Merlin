#!/bin/bash

# Render Build Script for Merlin Backend
# This runs during deployment on Render

set -e

echo "📦 Installing dependencies..."
pip install -e .

echo "✅ Build complete!"
