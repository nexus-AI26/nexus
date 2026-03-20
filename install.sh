#!/bin/bash
set -e

echo "✦ Installing nexus CLI..."

if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install it first."
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "Error: npm/Node.js is not installed. Please install Node.js first."
    exit 1
fi

DEST_DIR="$HOME/.nexus-src"

echo "[1/4] Cloning repository..."
if [ -d "$DEST_DIR" ]; then
    rm -rf "$DEST_DIR"
fi
git clone https://github.com/nexus-AI26/nexus.git "$DEST_DIR"

echo "[2/4] Installing dependencies..."
cd "$DEST_DIR"
npm install

echo "[3/4] Building TypeScript..."
npm run build

echo "[4/4] Linking globally..."
npm link

echo ""
echo "✦ nexus installed successfully!"
echo "Type 'nexus' in your terminal to get started."
