#!/bin/bash

# 前端启动脚本

# 设置工作目录
cd "$(dirname "$0")"

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
  echo "安装依赖..."
  npm install
fi

# 启动开发服务器
echo "启动前端开发服务器..."
npm start 