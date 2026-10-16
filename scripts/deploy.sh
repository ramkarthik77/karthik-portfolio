#!/usr/bin/env bash
# Manual deploy from your own computer: ./scripts/deploy.sh
# First time only, run: npx wrangler login
set -euo pipefail
PROJECT_NAME="${PROJECT_NAME:-karthik-portfolio}"

cd "$(dirname "$0")/.."
npm ci
npm run build
npx wrangler pages project create "$PROJECT_NAME" --production-branch=main 2>/dev/null || true
npx wrangler pages deploy dist --project-name="$PROJECT_NAME" --branch=main
