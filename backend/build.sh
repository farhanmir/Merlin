#!/bin/bash

# Render Build Script for Merlin Backend
# This runs during deployment on Render

set -e

echo "📦 Upgrading pip..."
pip install --upgrade pip

echo "📦 Installing dependencies..."
pip install -e .

echo "✅ Build complete!"
