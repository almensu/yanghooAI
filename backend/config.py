import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://auto_ai_subtitle:@localhost:5432/auto_ai_subtitle"
    BASE_DATA_PATH: str = "../data"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# 尝试从环境变量中获取值
settings = Settings()

# 打印配置信息（调试用）
print(f"数据库URL: {settings.DATABASE_URL}")
print(f"数据路径: {settings.BASE_DATA_PATH}") 