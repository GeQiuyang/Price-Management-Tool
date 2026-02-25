# 项目启停脚本文档

本文档整理了项目根目录下的启停脚本说明。这两个脚本主要用于管理前后端开发服务器的进程。

## 1. 启动项目：`start.sh`

**功能简介**：自动检测 `3001` (后端) 和 `5173` (前端) 端口是否被占用。如果被占用，会自动清理对应进程，然后重新启动项目。

```bash
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
```

## 2. 停止项目：`stop.sh`

**功能简介**：主要用于一键停止当前正在运行的前后端服务，通过定位 `3001` 和 `5173` 端口的关联进程并将其 kill 掉，确保项目被彻底关闭。

```bash
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

# 停止端口5173上的进程
if lsof -ti :5173 > /dev/null 2>&1; then
    echo "🎨 停止前端服务器 (端口5173)..."
    lsof -ti :5173 | xargs kill -9
    echo "✅ 前端服务器已停止"
else
    echo "ℹ️  前端服务器未运行"
fi

echo "🎉 项目已完全停止"
```
