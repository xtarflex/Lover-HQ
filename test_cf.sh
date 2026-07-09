#!/bin/bash
rm -rf node_modules package-lock.json pnpm-lock.yaml
npm install --legacy-peer-deps
npm run build
