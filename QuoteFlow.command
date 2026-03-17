#!/bin/zsh

# QuoteFlow 启动脚本 (双击运行)
# ═══════════════════════════════════════════

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "🚀正在启动 QuoteFlow..."

# 尝试加载 nvm (如果存在)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 检查 npm 是否可用
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ 未检测到 npm，请确保已安装 Node.js"
    echo "你可以从 https://nodejs.org 下载安装"
    echo ""
    echo "按回车键退出..."
    read
    exit 1
fi

# 启动项目
bash QuoteFlow.sh

# 如果启动失败，保持窗口开启以查看错误
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 启动失败"
    echo "按回车键退出..."
    read
fi
