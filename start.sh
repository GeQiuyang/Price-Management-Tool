#!/bin/bash

echo "🚀 启动项目..."

# 检查端口3001是否被占用
if lsof -ti :3001 > /dev/null 2>&1; then
    echo "⚠️  端口3001已被占用，正在停止..."
    lsof -ti :3001 | xargs kill -9
    sleep 1
fi

# 检查端口5173是否被占用
if lsof -ti :5173 > /dev/null 2>&1; then
    echo "⚠️  端口5173已被占用，正在停止..."
    lsof -ti :5173 | xargs kill -9
    sleep 1
fi

# 启动项目
echo "✅ 正在启动前后端服务器..."
npm run start