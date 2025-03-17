#!/bin/bash

# 前端启动脚本

# 设置工作目录
cd "$(dirname "$0")"

# 设置环境变量
export NODE_OPTIONS=--openssl-legacy-provider

# 检查端口占用
PORT=8002
if lsof -i :$PORT > /dev/null; then
  echo "端口 $PORT 已被占用，尝试关闭占用进程..."
  lsof -i :$PORT | grep LISTEN | awk '{print $2}' | xargs kill -9
  sleep 1
fi

# 清理缓存
if [ "$1" == "--clean" ]; then
  echo "清理缓存..."
  rm -rf node_modules/.cache
  rm -rf .umi
  rm -rf dist
fi

# 检查 nvm 是否可用
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  # 使用项目兼容的 Node.js 版本
  nvm use 16 || nvm install 16
elif command -v fnm &> /dev/null; then
  eval "$(fnm env)"
  fnm use 16 || fnm install 16
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v)
echo "当前 Node.js 版本: $NODE_VERSION"

# 安装依赖
if [ ! -d "node_modules" ] || [ "$1" == "--install" ]; then
  echo "安装依赖..."
  npm install
fi

# 启动应用
echo "启动前端应用..."
npm start 