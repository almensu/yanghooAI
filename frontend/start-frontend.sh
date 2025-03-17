#!/bin/bash

# 前端启动脚本 - 设置正确的环境变量并启动开发服务器

# 设置工作目录
cd "$(dirname "$0")"

# 清除已存在的环境变量
unset NODE_OPTIONS
unset PORT

# 设置环境变量 - 移除不兼容的选项
export NODE_OPTIONS=--openssl-legacy-provider
export PORT=8002

# 显示当前 Node.js 版本
echo "当前 Node.js 版本: $(node -v)"
echo "启动前端开发服务器..."

# 检查是否需要安装依赖
if [ ! -d "node_modules" ] || [ "$1" == "--install" ]; then
  echo "安装依赖..."
  npm install
fi

# 直接使用umi命令启动
echo "启动前端应用..."
npx umi dev

# 如果启动失败，显示错误信息
if [ $? -ne 0 ]; then
  echo "启动失败！请检查 Node.js 版本，建议使用 Node.js 16.x"
  echo "当前使用: $(node -v)"
  echo "可以尝试: 'export NODE_OPTIONS=\"--no-deprecation\" && npm run start'"
fi 