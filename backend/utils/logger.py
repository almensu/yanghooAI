import os
import logging
from logging.handlers import RotatingFileHandler
import datetime

# 创建日志目录
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# 日志文件名格式
log_date = datetime.datetime.now().strftime('%Y%m%d')
LOG_FILE = os.path.join(LOG_DIR, f'app_{log_date}.log')
API_LOG_FILE = os.path.join(LOG_DIR, f'api_{log_date}.log')

# 日志格式
LOG_FORMAT = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)

# 创建应用日志记录器
app_logger = logging.getLogger('app')
app_logger.setLevel(logging.INFO)

# 创建API日志记录器
api_logger = logging.getLogger('api')
api_logger.setLevel(logging.INFO)

# 防止日志重复
app_logger.propagate = False
api_logger.propagate = False

# 应用日志文件处理器
app_file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=10,
    encoding='utf-8'
)
app_file_handler.setFormatter(LOG_FORMAT)
app_logger.addHandler(app_file_handler)

# API日志文件处理器
api_file_handler = RotatingFileHandler(
    API_LOG_FILE,
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=10,
    encoding='utf-8'
)
api_file_handler.setFormatter(LOG_FORMAT)
api_logger.addHandler(api_file_handler)

# 控制台处理器
console_handler = logging.StreamHandler()
console_handler.setFormatter(LOG_FORMAT)
app_logger.addHandler(console_handler)
api_logger.addHandler(console_handler)

def get_logger(name):
    """获取指定名称的日志记录器"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # 防止日志重复
    logger.propagate = False
    
    # 文件处理器
    log_file = os.path.join(LOG_DIR, f'{name}_{log_date}.log')
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(LOG_FORMAT)
    logger.addHandler(file_handler)
    
    # 控制台处理器
    logger.addHandler(console_handler)
    
    return logger

def init_logging():
    """初始化日志系统"""
    # 设置日志文件权限
    try:
        os.chmod(LOG_DIR, 0o755)
        for log_file in [LOG_FILE, API_LOG_FILE]:
            if os.path.exists(log_file):
                os.chmod(log_file, 0o644)
    except Exception as e:
        app_logger.warning(f"设置日志文件权限失败: {str(e)}")
    
    app_logger.info("日志系统初始化完成")
    return True 