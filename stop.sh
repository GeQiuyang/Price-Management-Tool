#!/bin/bash

echo "🛑 停止项目..."

# 停止端口3001上的进程
if lsof -ti :3001 > /dev/null 2>&1; then
    echo "📦 停止后端服务器 (端口3001)..."
    lsof -ti :3001 | xargs kill -9
    echo "✅ 后端服务器已停止"
else
    echo "ℹ️  后端服务器未运行"
fi

# 停止前端服务器 (端口 5173 或 5174)
for port in 5173 5174; do
    if lsof -ti :$port > /dev/null 2>&1; then
        echo "🎨 停止前端服务器 (端口 $port)..."
        lsof -ti :$port | xargs kill -9
        echo "✅ 前端服务器 ($port) 已停止"
    fi
done

echo "🎉 项目已完全停止"