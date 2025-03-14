#!/bin/bash

# 后端启动脚本

# 设置工作目录
cd "$(dirname "$0")"

# 显示欢迎信息
echo "========================================"
echo "  Auto AI Subtitle 后端启动脚本"
echo "========================================"
echo ""

# 运行初始化脚本
echo "运行初始化脚本..."
python init.py
if [ $? -ne 0 ]; then
    echo "初始化失败，请检查日志文件"
    exit 1
fi

# 启动后端服务
echo "启动后端服务..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 