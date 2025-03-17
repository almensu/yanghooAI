#!/bin/bash

# 启动前端和后端服务的脚本

# 设置工作目录
cd "$(dirname "$0")"

# 显示欢迎信息
echo "==================================================="
echo "  Auto AI Subtitle API 启动脚本"
echo "  版本: 0.0.9"
echo "==================================================="

# 检查后端是否已经在运行
if pgrep -f "uvicorn main:app" > /dev/null; then
  echo "后端服务已经在运行"
else
  echo "启动后端服务..."
  cd backend
  # 在后台启动后端
  nohup ./start.sh > backend.log 2>&1 &
  cd ..
  echo "后端服务启动中..."
  sleep 2
fi

# 检查前端是否已经在运行
if pgrep -f "umi dev" > /dev/null; then
  echo "前端服务已经在运行"
else
  echo "启动前端服务..."
  cd frontend
  # 在后台启动前端
  ./start-frontend.sh
fi

echo "所有服务已启动"
echo "前端访问地址: http://localhost:8002"
echo "后端API地址: http://localhost:8000" 