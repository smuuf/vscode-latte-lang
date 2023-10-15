#!/bin/bash

cd $(dirname $0)/..

npm install -g pnpm

# Install Bun for running Jest tests (because it's gazillion times faster than
# JS Jest).
curl -fsSL https://bun.sh/install | bash # for macOS, Linux, and WSL