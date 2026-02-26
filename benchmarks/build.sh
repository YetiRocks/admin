#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$HOME/yeti/benchmarks"

echo "Building yeti-benchmarks (release)..."
cd "$SCRIPT_DIR"
cargo build --release

echo "Copying binaries to $DEPLOY_DIR..."
mkdir -p "$DEPLOY_DIR"

for bin in load-rest load-graphql load-vector load-realtime load-blob; do
    cp "target/release/$bin" "$DEPLOY_DIR/$bin"
    echo "  $bin -> $DEPLOY_DIR/$bin"
done

echo "Done. $(ls -1 "$DEPLOY_DIR" | wc -l | tr -d ' ') binaries deployed."
