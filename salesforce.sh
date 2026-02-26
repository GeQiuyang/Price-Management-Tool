#!/bin/bash

# SalesForce 价格管理工具 - 全局启动脚本
# 用法: 在任意目录下运行此脚本即可启动项目
# 安装: ln -sf ~/Downloads/Coding/AICoding/P1/salesforce.sh /usr/local/bin/salesforce

PROJECT_DIR="$HOME/Downloads/Coding/AICoding/P1"

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在: $PROJECT_DIR"
    exit 1
fi

echo "🚀 启动 SalesForce 价格管理工具..."
echo "📁 项目路径: $PROJECT_DIR"

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

# 进入项目目录并启动
cd "$PROJECT_DIR" || exit 1

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    npm install
fi

echo "✅ 正在启动前后端服务器..."
npm run start
