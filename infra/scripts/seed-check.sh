#!/bin/sh
echo "Checking DB connection..."
until pg_isready -h "${DB_HOST:-localhost}" -U "${DB_USER:-gtm_user}"; do
  echo "Waiting for postgres..."
  sleep 2
done
echo "DB ready."
