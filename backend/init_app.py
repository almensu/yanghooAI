#!/usr/bin/env python3
"""
应用初始化脚本
- 创建必要的目录
- 设置正确的权限
- 初始化数据库
"""

import os
import sys
import shutil
from pathlib import Path

# 获取项目根目录
ROOT_DIR = Path(__file__).parent.absolute()
DATA_DIR = Path(ROOT_DIR).parent / "data"
LOGS_DIR = ROOT_DIR / "logs"

def init_directories():
    """初始化必要的目录"""
    print("初始化目录...")
    
    # 创建日志目录
    os.makedirs(LOGS_DIR, exist_ok=True)
    print(f"创建日志目录: {LOGS_DIR}")
    
    # 创建数据目录
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"创建数据目录: {DATA_DIR}")
    
    # 设置权限
    try:
        # 确保日志目录有写入权限
        os.chmod(LOGS_DIR, 0o755)
        print(f"设置日志目录权限: 755")
        
        # 确保数据目录有写入权限
        os.chmod(DATA_DIR, 0o755)
        print(f"设置数据目录权限: 755")
    except Exception as e:
        print(f"设置目录权限失败: {str(e)}")

def init_database():
    """初始化数据库"""
    print("初始化数据库...")
    try:
        from models.database import init_db
        init_db()
        print("数据库初始化成功")
    except Exception as e:
        print(f"数据库初始化失败: {str(e)}")
        return False
    
    return True

def main():
    """主函数"""
    print("开始初始化应用...")
    
    # 初始化目录
    init_directories()
    
    # 初始化数据库
    if not init_database():
        print("应用初始化失败")
        return 1
    
    print("应用初始化成功")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 