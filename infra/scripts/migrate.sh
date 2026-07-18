#!/bin/sh
set -e
echo "Running TypeORM migrations..."
cd apps/backend
node -r tsconfig-paths/register -r ts-node/register \
  node_modules/typeorm/cli.js migration:run \
  -d src/database/data-source.ts
echo "Migrations complete."
