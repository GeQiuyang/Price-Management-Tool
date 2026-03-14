#!/bin/bash

# ═══════════════════════════════════════════════════
# Vector 报价管理工具 - 发行包打包脚本
# 用法: bash package-release.sh
# 产出: release/Vector-报价管理工具.zip
# ═══════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RELEASE_NAME="Vector-报价管理工具"
RELEASE_DIR="release"
TEMP_DIR="$RELEASE_DIR/$RELEASE_NAME"

echo "═══════════════════════════════════════════"
echo "  📦 Vector 报价管理工具 - 打包发行版"
echo "═══════════════════════════════════════════"
echo ""

# ─── 1. 检查 Node.js ───
if ! command -v node >/dev/null 2>&1; then
    echo "❌ 未检测到 Node.js，请先安装"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# ─── 2. 安装开发依赖（构建需要） ───
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

# ─── 3. 构建前端 ───
echo "🔨 构建前端..."
npm run build
echo "✅ 前端构建完成"

# ─── 4. 准备发行目录 ───
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# ─── 5. 复制必要文件 ───
echo "📂 复制文件..."

# 前端构建产物
cp -r dist "$TEMP_DIR/"

# 后端代码（排除 backups 和数据库）
mkdir -p "$TEMP_DIR/server"
cp "$SCRIPT_DIR/server/server.js" "$TEMP_DIR/server/"
# 不复制 database.db，首次启动会自动创建

# package.json 和 lock 文件
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"

# ─── 6. 安装生产依赖 ───
echo "📥 安装生产依赖..."
cd "$TEMP_DIR"
npm install --omit=dev --ignore-scripts 2>/dev/null
cd "$SCRIPT_DIR"
echo "✅ 生产依赖安装完成"

# ─── 7. 创建 Mac 启动脚本 ───
cat > "$TEMP_DIR/启动.command" << 'MACEOF'
#!/bin/zsh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo ""
echo "═══════════════════════════════════════════"
echo "  🚀 Vector 报价管理工具"
echo "═══════════════════════════════════════════"
echo ""

# 检查 Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org"
    echo ""
    echo "按回车键退出..."
    read
    exit 1
fi

# 检查端口
if lsof -ti :3001 >/dev/null 2>&1; then
    echo "⚠️  端口 3001 已被占用，正在释放..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo "✅ 正在启动服务器..."
echo "📍 访问地址: http://localhost:3001"
echo ""

# 2秒后打开浏览器
(sleep 2 && open "http://localhost:3001") &

# 启动服务器（前台运行，关闭终端即停止）
node server/server.js
MACEOF
chmod +x "$TEMP_DIR/启动.command"

# ─── 8. 创建 Mac 停止脚本 ───
cat > "$TEMP_DIR/停止.command" << 'MACSTOPEOF'
#!/bin/zsh
if lsof -ti :3001 >/dev/null 2>&1; then
    lsof -ti :3001 | xargs kill -9
    echo "✅ 服务器已停止"
else
    echo "ℹ️  服务器未在运行"
fi
MACSTOPEOF
chmod +x "$TEMP_DIR/停止.command"

# ─── 9. 创建 Windows 启动脚本 ───
cat > "$TEMP_DIR/启动.bat" << 'WINEOF'
@echo off
chcp 65001 >nul
title Vector 报价管理工具

echo.
echo ═══════════════════════════════════════════
echo   Vector 报价管理工具
echo ═══════════════════════════════════════════
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo ✅ 正在启动服务器...
echo 📍 访问地址: http://localhost:3001
echo.

:: 延迟打开浏览器
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3001"

:: 启动服务器
node server\server.js

pause
WINEOF

# ─── 10. 创建 Windows 停止脚本 ───
cat > "$TEMP_DIR/停止.bat" << 'WINSTOPEOF'
@echo off
chcp 65001 >nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>nul
)
echo 服务器已停止
timeout /t 2 /nobreak >nul
WINSTOPEOF

# ─── 11. 创建说明文件 ───
cat > "$TEMP_DIR/使用说明.txt" << 'READMEEOF'
═══════════════════════════════════════════════
  Vector 报价管理工具 - 使用说明
═══════════════════════════════════════════════

【环境要求】
  - Node.js v18 或更高版本
  - 下载地址: https://nodejs.org (选择 LTS 版本)

【启动方式】
  Mac:     双击 "启动.command"
  Windows: 双击 "启动.bat"

  启动后浏览器会自动打开 http://localhost:3001

【停止方式】
  Mac:     双击 "停止.command" 或关闭终端窗口
  Windows: 双击 "停止.bat" 或关闭命令行窗口

【默认账号】
  管理员: admin_root / AdminPassword@2026
  业务员: sales_user / SalesLogin#88
  外贸员: trade_user / TradeSecure$99

【数据说明】
  首次启动会自动创建数据库（server/database.db）
  数据备份: 复制 server/database.db 文件即可
═══════════════════════════════════════════════
READMEEOF

# ─── 12. 打包为 zip ───
echo "📦 正在打包..."
cd "$RELEASE_DIR"
zip -r -q "${RELEASE_NAME}.zip" "$RELEASE_NAME"
cd "$SCRIPT_DIR"

# 清理临时目录
rm -rf "$TEMP_DIR"

# ─── 完成 ───
ZIP_SIZE=$(du -sh "$RELEASE_DIR/${RELEASE_NAME}.zip" | cut -f1)
echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ 打包完成！"
echo "  📁 文件: $RELEASE_DIR/${RELEASE_NAME}.zip"
echo "  📏 大小: $ZIP_SIZE"
echo "═══════════════════════════════════════════"
echo ""
