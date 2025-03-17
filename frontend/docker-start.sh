#!/bin/bash

# 使用 Docker 运行前端开发服务器
# 这个脚本使用 Node.js 16 版本的 Docker 镜像来运行前端

# 设置工作目录
cd "$(dirname "$0")"

# 创建 Docker 容器并运行前端
docker run -it --rm \
  -v "$(pwd):/app" \
  -w /app \
  -p 8002:8002 \
  -e PORT=8002 \
  node:16 \
  bash -c "npm install && npm run start" 