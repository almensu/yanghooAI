from models.database import SessionLocal, Video
from utils.hash_utils import generate_hash_name, create_hash_folder
from video2wav import convert_video_to_wav
from download import download_video
import whisperx  # 用于语音识别
from en2cn import translate_text, translate_json_file
from json2ass import json_to_ass
from generate_md import process_json_files
import os
from typing import Optional, List
from datetime import datetime
from config import settings
import json  # 添加到文件顶部的导入部分
import logging
import shutil
import threading
from PIL import Image
import subprocess

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class VideoProcessor:
    def __init__(self):
        self.db = SessionLocal()
        self.logger = logging.getLogger(__name__)
        
    def get_videos(self, skip: int = 0, limit: int = 10) -> List[Video]:
        """获取视频列表，支持分页"""
        return self.db.query(Video).offset(skip).limit(limit).all()
        
    def delete_video(self, hash_name: str) -> bool:
        """删除视频及其相关文件"""
        try:
            video = self.get_video_by_hash(hash_name)
            if not video:
                return False
                
            # 删除文件夹及其内容
            if os.path.exists(video.folder_hash_name_path):
                shutil.rmtree(video.folder_hash_name_path)
                
            # 从数据库中删除记录
            self.db.delete(video)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.logger.error(f"删除视频失败: {str(e)}")
            self.db.rollback()
            return False
            
    def transcribe_audio(self, audio_path: str, output_dir: str) -> str:
        """使用whisperx进行语音识别"""
        device = "cpu"
        compute_type = "int8"
        model = whisperx.load_model("large-v3", device, compute_type=compute_type)
        
        audio = whisperx.load_audio(audio_path)
        result = model.transcribe(audio, batch_size=8)
        
        # 使用固定的输出文件名
        json_path = os.path.join(output_dir, "en.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=4)
            
        return json_path
        
    def process_video(self, url: str) -> Optional[Video]:
        """处理视频流程"""
        try:
            self.logger.info(f"开始处理视频: {url}")
            
            # 检查URL是否已存在
            existing_video = self.db.query(Video).filter(Video.url == url).first()
            if existing_video:
                # 检查文件是否实际存在
                if not os.path.exists(existing_video.folder_hash_name_path):
                    self.logger.info(f"数据库记录存在但文件丢失，删除记录: {existing_video.hash_name}")
                    self.db.delete(existing_video)
                    self.db.commit()
                else:
                    # 检查缩略图是否存在，如果不存在则尝试修复
                    if existing_video.pic_thumb_path and not os.path.exists(existing_video.pic_thumb_path):
                        self._fix_thumbnail_path(existing_video)
                        self.db.commit()
                    
                    self.logger.info(f"视频已存在: {existing_video.hash_name}")
                    return existing_video
            
            # 生成hash和创建文件夹
            hash_name = generate_hash_name(url)
            folder_path = create_hash_folder(hash_name, settings.BASE_DATA_PATH)
            
            # 创建子目录
            original_dir = os.path.join(folder_path, "original")
            subtitles_dir = os.path.join(folder_path, "subtitles")
            docs_dir = os.path.join(folder_path, "docs")
            
            os.makedirs(original_dir, exist_ok=True)
            os.makedirs(subtitles_dir, exist_ok=True)
            os.makedirs(docs_dir, exist_ok=True)
            
            # 创建视频记录（但还不保存到数据库）
            video = Video(
                url=url,
                hash_name=hash_name,
                folder_hash_name_path=folder_path,
                created_at=datetime.utcnow()
            )
            
            # 下载视频
            download_result = download_video(url, output_dir=original_dir)
            if not download_result:
                raise Exception("视频下载失败")
            
            video.file_path = download_result['video_path']
            video.title = download_result['title']
            
            # 处理缩略图 - 统一使用JPG格式
            thumbnail_path = os.path.join(original_dir, "thumbnail.jpg")
            
            # 如果下载器提供了缩略图，尝试转换为JPG格式
            if 'thumbnail_path' in download_result and download_result['thumbnail_path']:
                try:
                    # 如果下载的缩略图存在，转换为JPG格式
                    if os.path.exists(download_result['thumbnail_path']):
                        img = Image.open(download_result['thumbnail_path'])
                        img = img.convert('RGB')  # 确保可以保存为JPG
                        img.save(thumbnail_path, "JPEG", quality=90)
                        self.logger.info(f"缩略图转换为JPG成功: {thumbnail_path}")
                except Exception as e:
                    self.logger.error(f"缩略图转换失败: {str(e)}")
            
            # 如果缩略图不存在，从视频中提取
            if not os.path.exists(thumbnail_path):
                self.logger.info(f"尝试从视频中提取缩略图: {video.file_path}")
                try:
                    import cv2
                    cap = cv2.VideoCapture(video.file_path)
                    
                    # 获取视频总帧数
                    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                    # 选择10%位置的帧作为缩略图
                    frame_position = min(int(total_frames * 0.1), 100)
                    if frame_position <= 0:
                        frame_position = 1
                        
                    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_position)
                    success, frame = cap.read()
                    
                    if success:
                        # 调整图像大小为16:9比例的缩略图
                        height, width = frame.shape[:2]
                        target_width = 480
                        target_height = 270
                        
                        # 裁剪或缩放以适应目标尺寸
                        if width/height > target_width/target_height:  # 原图更宽
                            new_width = int(height * target_width / target_height)
                            start_x = (width - new_width) // 2
                            frame = frame[:, start_x:start_x+new_width]
                        else:  # 原图更高
                            new_height = int(width * target_height / target_width)
                            start_y = (height - new_height) // 2
                            frame = frame[start_y:start_y+new_height, :]
                        
                        # 缩放到目标尺寸
                        frame = cv2.resize(frame, (target_width, target_height))
                        
                        # 保存为JPG格式
                        cv2.imwrite(thumbnail_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                        self.logger.info(f"从视频中提取缩略图成功: {thumbnail_path}")
                    cap.release()
                except Exception as e:
                    self.logger.error(f"从视频中提取缩略图失败: {str(e)}")
                    # 尝试使用FFmpeg作为备选方案
                    try:
                        import subprocess
                        cmd = [
                            "ffmpeg", "-i", video.file_path, 
                            "-ss", "00:00:05", "-vframes", "1", 
                            "-vf", "scale=480:270", 
                            "-y", thumbnail_path
                        ]
                        subprocess.run(cmd, check=True)
                        self.logger.info(f"使用FFmpeg生成缩略图成功: {thumbnail_path}")
                    except Exception as ffmpeg_error:
                        self.logger.error(f"FFmpeg生成缩略图失败: {str(ffmpeg_error)}")
            
            # 设置缩略图路径（如果文件存在）
            if os.path.exists(thumbnail_path):
                video.pic_thumb_path = thumbnail_path
            else:
                self.logger.warning(f"无法生成缩略图，将使用默认图片")
            
            # 确保视频文件已下载
            if not os.path.exists(video.file_path):
                raise Exception("视频文件未创建成功")
            
            # 生成WAV
            wav_path = convert_video_to_wav(video.file_path, output_dir=original_dir)
            if not wav_path or not os.path.exists(wav_path):
                raise Exception("WAV文件生成失败")
            video.wav_path = wav_path
            
            # 生成字幕
            json_result = self.transcribe_audio(wav_path, subtitles_dir)
            if not json_result or not os.path.exists(json_result):
                raise Exception("字幕生成失败")
            video.subtitle_en_json_path = json_result
            
            # 翻译字幕
            zh_json = self.translate_json_file(json_result, subtitles_dir)
            if not zh_json or not os.path.exists(zh_json):
                raise Exception("字幕翻译失败")
            video.subtitle_zh_cn_json_path = zh_json
            
            # 生成ASS字幕
            ass_path = os.path.join(subtitles_dir, "bilingual.ass")
            self.generate_ass_subtitle(zh_json, ass_path)
            if not os.path.exists(ass_path):
                raise Exception("ASS字幕生成失败")
            video.subtitle_en_ass_path = ass_path
            
            # 生成MD文件
            self.generate_md_files(hash_name, docs_dir)
            en_md = os.path.join(docs_dir, "en.md")
            zh_md = os.path.join(docs_dir, "zh.md")
            if not os.path.exists(en_md) or not os.path.exists(zh_md):
                raise Exception("MD文件生成失败")
            video.subtitle_en_md_path = en_md
            video.subtitle_zh_cn_md_path = zh_md
            
            # 所有文件都成功生成后，才保存到数据库
            self.db.add(video)
            self.db.commit()
            
            self.logger.info(f"视频处理完成: {video.hash_name}")
            return video
            
        except Exception as e:
            self.logger.error(f"处理失败: {str(e)}")
            # 如果处理失败，清理已创建的文件
            if 'folder_path' in locals() and os.path.exists(folder_path):
                shutil.rmtree(folder_path)
            self.db.rollback()
            raise e
        finally:
            self.db.close()
            
    def get_video_by_hash(self, hash_name: str) -> Optional[Video]:
        """通过hash获取视频信息"""
        return self.db.query(Video).filter(Video.hash_name == hash_name).first() 
        
    def translate_json_file(self, json_file: str, output_dir: str) -> str:
        """翻译字幕JSON文件"""
        try:
            self.logger.info(f"开始翻译字幕: {json_file}")
            
            # 读取JSON文件
            with open(json_file, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            # 翻译每个片段
            for segment in json_data['segments']:
                translated_text = translate_text(segment['text'])
                segment['translated_text'] = translated_text
            
            # 使用固定的输出文件名
            output_file = os.path.join(output_dir, "zh.json")
            
            # 保存翻译后的JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=4)
            
            self.logger.info(f"字幕翻译完成: {output_file}")
            return output_file
            
        except Exception as e:
            self.logger.error(f"字幕翻译失败: {str(e)}")
            raise

    def generate_ass_subtitle(self, json_file: str, output_file: str) -> None:
        """生成ASS格式字幕"""
        try:
            self.logger.info(f"开始生成ASS字幕: {output_file}")
            json_to_ass(json_file, output_file)
            self.logger.info(f"ASS字幕生成完成: {output_file}")
            
        except Exception as e:
            self.logger.error(f"ASS字幕生成失败: {str(e)}")
            raise

    def generate_md_files(self, hash_name: str, output_dir: str) -> None:
        """生成MD格式字幕文档"""
        try:
            self.logger.info(f"开始生成MD文档: {hash_name}")
            process_json_files(hash_name, output_dir)
            self.logger.info(f"MD文档生成完成")
            
        except Exception as e:
            self.logger.error(f"MD文档生成失败: {str(e)}")
            raise

    def check_file_exists(self, file_path: str) -> bool:
        """检查文件是否存在"""
        return os.path.exists(file_path) if file_path else False

    def get_video_status(self, video: Video) -> str:
        """获取视频处理状态"""
        if not self.check_file_exists(video.file_path):
            return "downloading"
        if not self.check_file_exists(video.wav_path):
            return "converting"
        if not self.check_file_exists(video.subtitle_en_json_path):
            return "transcribing"
        if not self.check_file_exists(video.subtitle_zh_cn_json_path):
            return "translating"
        if not self.check_file_exists(video.subtitle_en_ass_path):
            return "generating_subtitle"
        if not self.check_file_exists(video.subtitle_en_md_path):
            return "generating_document"
        return "completed"

    def process_local_video(self, file_path, title):
        """
        处理本地视频文件
        
        Args:
            file_path: 本地视频文件路径
            title: 视频标题
        
        Returns:
            Video: 处理后的视频数据库对象
        """
        try:
            # 生成唯一的hash名称
            hash_name = self._generate_hash_name()
            
            # 创建存储目录
            folder_hash_name_path = os.path.join("data", hash_name)
            os.makedirs(folder_hash_name_path, exist_ok=True)
            
            # 复制视频文件到目标位置
            video_filename = f"{hash_name}.mp4"
            target_video_path = os.path.join(folder_hash_name_path, video_filename)
            shutil.copy(file_path, target_video_path)
            
            # 创建数据库记录
            video = Video(
                title=title,
                url="local_upload",  # 标记为本地上传
                hash_name=hash_name,
                folder_hash_name_path=folder_hash_name_path,
                file_path=target_video_path
            )
            
            # 保存到数据库
            with self.get_db_session() as session:
                session.add(video)
                session.commit()
                session.refresh(video)
            
            # 异步处理视频（生成缩略图、提取音频、生成字幕等）
            threading.Thread(
                target=self._process_video_async,
                args=(video.id, target_video_path),
                daemon=True
            ).start()
            
            return video
        
        except Exception as e:
            self.logger.error(f"处理本地视频失败: {str(e)}")
            raise Exception(f"处理本地视频失败: {str(e)}")

    def get_db_session(self):
        """获取数据库会话"""
        return SessionLocal()

    def _generate_hash_name(self):
        """生成唯一的hash名称"""
        import uuid
        import time
        # 使用时间戳和UUID组合生成唯一标识
        return f"{int(time.time())}_{uuid.uuid4().hex[:8]}"

    def _process_video_async(self, video_id, video_path):
        """
        异步处理上传的视频文件
        
        Args:
            video_id: 视频数据库ID
            video_path: 视频文件路径
        """
        try:
            self.logger.info(f"开始异步处理视频: {video_id}")
            
            # 获取视频对象
            with self.get_db_session() as session:
                video = session.query(Video).filter(Video.id == video_id).first()
                if not video:
                    self.logger.error(f"找不到视频记录: {video_id}")
                    return
                    
                # 创建子目录
                folder_path = video.folder_hash_name_path
                original_dir = os.path.join(folder_path, "original")
                subtitles_dir = os.path.join(folder_path, "subtitles")
                docs_dir = os.path.join(folder_path, "docs")
                
                os.makedirs(original_dir, exist_ok=True)
                os.makedirs(subtitles_dir, exist_ok=True)
                os.makedirs(docs_dir, exist_ok=True)
                
                # 生成缩略图 - 使用统一的JPG格式
                thumbnail_path = os.path.join(original_dir, "thumbnail.jpg")
                try:
                    import cv2
                    
                    # 使用OpenCV提取视频帧作为缩略图
                    cap = cv2.VideoCapture(video_path)
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 100)  # 获取第100帧作为缩略图
                    success, frame = cap.read()
                    if success:
                        thumbnail_path = os.path.join(original_dir, "thumbnail.jpg")
                        cv2.imwrite(thumbnail_path, frame)
                        video.pic_thumb_path = thumbnail_path
                        self.logger.info(f"缩略图生成成功: {thumbnail_path}")
                    else:
                        self.logger.error("无法从视频中提取帧")
                    cap.release()
                except Exception as e:
                    self.logger.error(f"生成缩略图失败: {str(e)}")
                    # 继续处理，不因缩略图失败而中断整个流程
                
                session.commit()
                
                # 生成WAV
                wav_path = convert_video_to_wav(video_path, output_dir=original_dir)
                if not wav_path or not os.path.exists(wav_path):
                    raise Exception("WAV文件生成失败")
                video.wav_path = wav_path
                session.commit()
                
                # 生成字幕
                json_result = self.transcribe_audio(wav_path, subtitles_dir)
                if not json_result or not os.path.exists(json_result):
                    raise Exception("字幕生成失败")
                video.subtitle_en_json_path = json_result
                session.commit()
                
                # 翻译字幕
                zh_json = self.translate_json_file(json_result, subtitles_dir)
                if not zh_json or not os.path.exists(zh_json):
                    raise Exception("字幕翻译失败")
                video.subtitle_zh_cn_json_path = zh_json
                session.commit()
                
                # 生成ASS字幕
                ass_path = os.path.join(subtitles_dir, "bilingual.ass")
                self.generate_ass_subtitle(zh_json, ass_path)
                if not os.path.exists(ass_path):
                    raise Exception("ASS字幕生成失败")
                video.subtitle_en_ass_path = ass_path
                session.commit()
                
                # 生成MD文件
                self.generate_md_files(video.hash_name, docs_dir)
                en_md = os.path.join(docs_dir, "en.md")
                zh_md = os.path.join(docs_dir, "zh.md")
                if not os.path.exists(en_md) or not os.path.exists(zh_md):
                    raise Exception("MD文件生成失败")
                video.subtitle_en_md_path = en_md
                video.subtitle_zh_cn_md_path = zh_md
                session.commit()
                
                self.logger.info(f"视频异步处理完成: {video_id}")
                
        except Exception as e:
            self.logger.error(f"视频异步处理失败: {str(e)}")
            # 记录错误但不删除文件，保留已处理的部分 

    def _fix_thumbnail_path(self, video: Video) -> None:
        """尝试修复缩略图路径"""
        try:
            if video.folder_hash_name_path:
                original_dir = os.path.join(video.folder_hash_name_path, "original")
                if os.path.exists(original_dir):
                    # 检查各种可能的缩略图文件名
                    possible_names = [
                        "thumbnail.jpg",
                        "thumbnail.webp",
                        "thumbnail.webp.webp",
                        "thumbnail.png"
                    ]
                    
                    for name in possible_names:
                        path = os.path.join(original_dir, name)
                        if os.path.exists(path):
                            video.pic_thumb_path = path
                            self.logger.info(f"修复缩略图路径: {path}")
                            break
        except Exception as e:
            self.logger.error(f"修复缩略图路径失败: {str(e)}")

    def render_subtitle_to_video(self, hash_name: str) -> Optional[str]:
        """将字幕渲染到视频中，生成带有硬编码字幕的新视频文件
        
        Args:
            hash_name: 视频的哈希名称
            
        Returns:
            Optional[str]: 成功时返回新视频的路径，失败时返回None
        """
        try:
            # 获取视频信息
            video = self.get_video_by_hash(hash_name)
            if not video:
                self.logger.error(f"视频不存在: {hash_name}")
                return None
                
            # 检查必要的文件是否存在
            if not video.file_path or not os.path.exists(video.file_path):
                self.logger.error(f"视频文件不存在: {video.file_path}")
                return None
                
            # 检查字幕文件
            subtitles_dir = os.path.join(video.folder_hash_name_path, "subtitles")
            if not os.path.exists(subtitles_dir):
                self.logger.error(f"字幕目录不存在: {subtitles_dir}")
                return None
                
            # 查找ASS字幕文件
            ass_file = None
            if video.subtitle_en_ass_path and os.path.exists(video.subtitle_en_ass_path):
                ass_file = video.subtitle_en_ass_path
            else:
                # 尝试在字幕目录中查找
                possible_names = ["bilingual.ass", "en.ass", "zh.ass"]
                for name in possible_names:
                    path = os.path.join(subtitles_dir, name)
                    if os.path.exists(path):
                        ass_file = path
                        break
                        
            if not ass_file:
                self.logger.error(f"未找到ASS字幕文件: {hash_name}")
                return None
                
            # 创建输出目录
            output_dir = os.path.join(video.folder_hash_name_path, "rendered")
            os.makedirs(output_dir, exist_ok=True)
            
            # 设置输出文件路径
            output_file = os.path.join(output_dir, f"{hash_name}_with_subtitles.mp4")
            
            # 使用FFmpeg渲染字幕到视频
            cmd = [
                "ffmpeg",
                "-i", video.file_path,
                "-vf", f"ass={ass_file}",
                "-c:v", "libx264",
                "-crf", "18",  # 视频质量，值越小质量越高
                "-c:a", "aac",
                "-b:a", "192k",
                "-y",  # 覆盖已存在的文件
                output_file
            ]
            
            self.logger.info(f"开始渲染字幕到视频: {hash_name}")
            self.logger.info(f"命令: {' '.join(cmd)}")
            
            # 执行命令
            subprocess.run(cmd, check=True, capture_output=True)
            
            if os.path.exists(output_file):
                self.logger.info(f"字幕渲染成功: {output_file}")
                return output_file
            else:
                self.logger.error(f"字幕渲染失败，输出文件不存在: {output_file}")
                return None
                
        except subprocess.CalledProcessError as e:
            self.logger.error(f"字幕渲染失败 (FFmpeg错误): {e.stderr.decode() if e.stderr else str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"字幕渲染失败: {str(e)}")
            return None 