#!/bin/bash

cd $(dirname $0)/..

pnpm vsce package --no-dependencies
