#!/bin/zsh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNTIME_DIR="$SCRIPT_DIR/.local-runtime"
PID_FILE="$RUNTIME_DIR/server.pid"
LOG_FILE="$RUNTIME_DIR/server.log"
APP_URL="http://127.0.0.1:3001"

mkdir -p "$RUNTIME_DIR"
cd "$SCRIPT_DIR" || exit 1

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "未检测到 Node.js" message "请先安装 Node.js 20 或更高版本，然后重新启动。" as critical'
  exit 1
fi

if [ ! -d "node_modules" ]; then
  npm install || exit 1
fi

if [ ! -d "dist" ]; then
  npm run package:local || exit 1
fi

if [ -f "$PID_FILE" ]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if kill -0 "$EXISTING_PID" >/dev/null 2>&1; then
    open "$APP_URL"
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

nohup npm run start:local > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

sleep 2
open "$APP_URL"

exit 0
