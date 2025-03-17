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
    subtitle_en_with_words_json_path = Column(String)  # 新增字段：带单词级别时间戳的英文字幕
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    last_synced_at = Column(DateTime, nullable=True) 