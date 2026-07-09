#!/bin/bash
# Check if the build command succeeds
if pnpm build; then
  echo "Build successful"
else
  echo "Build failed"
fi
