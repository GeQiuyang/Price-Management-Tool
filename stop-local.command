#!/bin/zsh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.local-runtime/server.pid"

if [ -f "$PID_FILE" ]; then
  SERVER_PID="$(cat "$PID_FILE")"
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID"
  fi
  rm -f "$PID_FILE"
fi

exit 0
