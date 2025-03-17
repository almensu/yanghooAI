@app.get("/video/{hash_name}/transcript/words",
    summary="获取带单词级别时间戳的字幕",
    description="获取WhisperX生成的带单词级别时间戳的字幕"
)
async def get_word_level_transcript(
    hash_name: str = Path(..., description="视频的唯一 hash 标识")
):
    """获取带单词级别时间戳的字幕"""
    try:
        api_logger.info(f"请求获取带单词级别时间戳的字幕: {hash_name}")
        
        # 获取视频信息
        video = processor.get_video_by_hash(hash_name)
        if not video:
            api_logger.warning(f"视频未找到: {hash_name}")
            raise HTTPException(status_code=404, detail=f"视频未找到: {hash_name}")
        
        # 检查字幕文件是否存在
        if not video.subtitle_en_with_words_json_path or not os.path.exists(video.subtitle_en_with_words_json_path):
            # 如果文件不存在，尝试重新生成
            try:
                api_logger.info(f"字幕文件不存在，尝试重新生成: {hash_name}")
                output_file = processor.process_whisperx(video)
                api_logger.info(f"字幕文件生成成功: {output_file}")
            except Exception as e:
                api_logger.error(f"字幕文件生成失败: {str(e)}")
                raise HTTPException(status_code=500, detail=f"字幕文件生成失败: {str(e)}")
        
        # 读取字幕文件
        try:
            with open(video.subtitle_en_with_words_json_path, 'r', encoding='utf-8') as f:
                transcript_data = json.load(f)
                return transcript_data
        except Exception as e:
            api_logger.error(f"读取字幕文件失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"读取字幕文件失败: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"获取字幕失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 在 VideoResponse 模型中添加新字段
class VideoResponse(BaseModel):
    # ... existing code ...
    files: dict = {
        "video": None,
        "thumbnail": None,
        "wav": None,
        "subtitles": {
            "en_json": None,
            "zh_json": None,
            "ass": None,
            "en_md": None,
            "zh_md": None,
            "en_with_words": None  # 新增字段
        }
    }
    
    @classmethod
    def from_db_model(cls, video: Video):
        # ... existing code ...
        subtitle_en_with_words_path = f"/file/{video.subtitle_en_with_words_json_path}" if video.subtitle_en_with_words_json_path else None
        
        return cls(
            id=video.id,
            title=video.title,
            url=video.url,
            hash_name=video.hash_name,
            folder_hash_name_path=video.folder_hash_name_path,
            created_at=video.created_at,
            status=VideoProcessor().get_video_status(video),
            files={
                "video": file_path,
                "thumbnail": pic_thumb_path,
                "wav": wav_path,
                "subtitles": {
                    "en_json": subtitle_en_json_path,
                    "zh_json": subtitle_zh_cn_json_path,
                    "en_ass": subtitle_en_ass_path,
                    "zh_ass": subtitle_zh_cn_ass_path,
                    "en_md": subtitle_en_md_path,
                    "zh_md": subtitle_zh_cn_md_path,
                    "en_with_words": subtitle_en_with_words_path  # 新增字段
                }
            }
        ) 