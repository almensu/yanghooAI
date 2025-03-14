#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
初始化脚本
在应用启动前运行，确保环境正确配置
"""

import os
import sys
import logging
from utils.logger import init_logging, app_logger
from models.database import init_db

def init_directories():
    """初始化必要的目录结构"""
    # 项目根目录
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 需要创建的目录
    directories = [
        os.path.join(root_dir, 'data'),
        os.path.join(root_dir, 'data', 'videos'),
        os.path.join(root_dir, 'data', 'thumbnails'),
        os.path.join(root_dir, 'data', 'subtitles'),
        os.path.join(root_dir, 'frontend', 'assets'),
    ]
    
    for directory in directories:
        try:
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
                app_logger.info(f"创建目录: {directory}")
        except Exception as e:
            app_logger.error(f"创建目录失败: {directory}, 错误: {str(e)}")
            return False
    
    return True

def check_environment():
    """检查运行环境"""
    # 检查Python版本
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        app_logger.warning(f"Python版本过低: {sys.version}，推荐使用Python 3.8+")
    else:
        app_logger.info(f"Python版本: {sys.version}")
    
    # 检查必要的环境变量
    env_vars = ['PATH', 'PYTHONPATH']
    for var in env_vars:
        if var in os.environ:
            app_logger.debug(f"环境变量 {var}: {os.environ.get(var)}")
        else:
            app_logger.warning(f"环境变量 {var} 未设置")
    
    return True

def main():
    """主初始化函数"""
    try:
        # 初始化日志系统
        init_logging()
        app_logger.info("=== 开始初始化应用 ===")
        
        # 初始化目录
        if not init_directories():
            app_logger.error("初始化目录失败")
            return False
        
        # 检查环境
        if not check_environment():
            app_logger.error("环境检查失败")
            return False
        
        # 初始化数据库
        try:
            init_db()
            app_logger.info("数据库初始化成功")
        except Exception as e:
            app_logger.error(f"数据库初始化失败: {str(e)}")
            return False
        
        app_logger.info("=== 应用初始化完成 ===")
        return True
    
    except Exception as e:
        logging.error(f"初始化过程中发生错误: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 