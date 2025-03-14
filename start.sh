#!/bin/bash

# 项目启动脚本
# 同时启动前端和后端服务

# 设置工作目录
cd "$(dirname "$0")"

# 显示欢迎信息
echo "========================================"
echo "  Auto AI Subtitle 启动脚本"
echo "========================================"
echo ""

# 检查conda环境
if ! command -v conda &> /dev/null; then
    echo "错误: 未找到conda命令，请确保已安装Anaconda或Miniconda。"
    exit 1
fi

# 激活conda环境
echo "激活conda环境: auto_ai_subtitle-v0.0.9"
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate auto_ai_subtitle-v0.0.9

# 检查环境是否激活成功
if [ $? -ne 0 ]; then
    echo "错误: 激活conda环境失败，请确保环境存在。"
    echo "尝试创建环境..."
    conda create -n auto_ai_subtitle-v0.0.9 python=3.9 -y
    conda activate auto_ai_subtitle-v0.0.9
    
    if [ $? -ne 0 ]; then
        echo "错误: 创建并激活环境失败，请手动检查。"
        exit 1
    fi
fi

# 启动后端服务
echo "启动后端服务..."
cd backend
./start.sh &
BACKEND_PID=$!
cd ..

# 等待后端服务启动
echo "等待后端服务启动..."
sleep 3

# 启动前端服务
echo "启动前端服务..."
cd frontend
./start.sh &
FRONTEND_PID=$!
cd ..

# 显示进程信息
echo ""
echo "服务已启动:"
echo "后端进程ID: $BACKEND_PID"
echo "前端进程ID: $FRONTEND_PID"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获中断信号
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# 等待子进程
wait 