from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
from datetime import datetime

# 创建数据库引擎
engine = create_engine(settings.DATABASE_URL)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

class Video(Base):
    __tablename__ = "video"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    url = Column(String, unique=True, index=True)
    hash_name = Column(String, unique=True, index=True)
    folder_hash_name_path = Column(String)
    pic_thumb_path = Column(String)
    file_path = Column(String)
    wav_path = Column(String)
    subtitle_en_json_path = Column(String)
    subtitle_zh_cn_json_path = Column(String)
    subtitle_en_ass_path = Column(String)
    subtitle_zh_cn_ass_path = Column(String)
    subtitle_en_md_path = Column(String)
    subtitle_zh_cn_md_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    """初始化数据库"""
    Base.metadata.create_all(bind=engine) 