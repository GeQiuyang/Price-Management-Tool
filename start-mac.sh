#!/bin/bash

echo "Starting Price Management Tool..."

# Start backend server
echo "Starting backend server..."
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/server\" && npm start"'

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"'

echo "Servers are starting..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
