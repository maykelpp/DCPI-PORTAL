#!/bin/sh
set -eu

# El proveedor escucha solo en localhost: no queda expuesto a Internet.
cd /opt/bgutil-ytdlp-pot-provider/server/node_modules
deno run --allow-env --allow-net --allow-ffi=. --allow-read=. ../src/main.ts --host 127.0.0.1 &
POT_PID=$!

gunicorn --workers 1 --threads 4 --timeout 900 --bind "0.0.0.0:${PORT:-10000}" app:app &
APP_PID=$!

cleanup() {
  kill "$APP_PID" "$POT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait "$APP_PID"
