#!/bin/sh
set -eu

APP_DIR="/app"
PROVIDER_DIR="/opt/bgutil-ytdlp-pot-provider/server"

# Start BgUtils from its installed dependency directory.
cd "$PROVIDER_DIR/node_modules"
deno run --allow-env --allow-net --allow-ffi=. --allow-read=. ../src/main.ts --host 127.0.0.1 --port 4416 &
POT_PID=$!

cleanup() {
  kill "$POT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait until the token provider is ready before starting the API.
READY=0
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:4416/ping >/dev/null 2>&1; then
    READY=1
    break
  fi
  if ! kill -0 "$POT_PID" 2>/dev/null; then
    echo "BgUtils token provider exited during startup" >&2
    wait "$POT_PID" || true
    exit 1
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "BgUtils token provider did not become ready on 127.0.0.1:4416" >&2
  exit 1
fi

# Gunicorn must run from the directory containing app.py.
cd "$APP_DIR"
exec gunicorn --chdir "$APP_DIR" --workers 1 --threads 4 --timeout 900 --bind "0.0.0.0:${PORT:-10000}" app:app
