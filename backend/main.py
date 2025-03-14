from fastapi import FastAPI, HTTPException, Query, Path, UploadFile, File, Form, Request, Body
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from services.video_processor import VideoProcessor
from models.database import init_db, Video
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
import os
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageDraw, ImageFont
import json
from utils.logger import app_logger, api_logger, init_logging
import time

# 初始化日志系统
init_logging()

# 创建 FastAPI 应用
app = FastAPI(
    title="Auto AI Subtitle",
    description="自动生成视频字幕的 API 服务",
    version="0.0.9",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 添加请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # 记录请求信息
    api_logger.info(f"Request: {request.method} {request.url.path}")
    
    # 处理请求
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # 记录响应信息
        api_logger.info(f"Response: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
        
        return response
    except Exception as e:
        # 记录异常信息
        process_time = time.time() - start_time
        api_logger.error(f"Error: {request.method} {request.url.path} - {str(e)} - Time: {process_time:.4f}s")
        raise

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 在创建app后，添加静态文件挂载
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# 添加数据目录的静态文件挂载
app.mount("/data", StaticFiles(directory="../data"), name="data")

processor = VideoProcessor()

# 请求模型
class VideoRequest(BaseModel):
    url: HttpUrl
    quality: Optional[str] = "720p"
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.youtube.com/watch?v=kYfNvmF0Bqw",
                "quality": "720p"
            }
        }

# 批量导入请求模型
class BatchVideoRequest(BaseModel):
    urls: List[HttpUrl]
    quality: Optional[str] = "720p"
    
    class Config:
        json_schema_extra = {
            "example": {
                "urls": [
                    "https://www.youtube.com/watch?v=kYfNvmF0Bqw",
                    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                ],
                "quality": "720p"
            }
        }

# 响应模型
class VideoResponse(BaseModel):
    id: int
    title: str
    url: str
    hash_name: str
    folder_hash_name_path: str
    created_at: datetime
    status: str
    files: dict = {
        "video": None,
        "thumbnail": None,
        "wav": None,
        "subtitles": {
            "en_json": None,
            "zh_json": None,
            "ass": None,
            "en_md": None,
            "zh_md": None
        }
    }
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_db_model(cls, video: Video):
        # 处理文件路径，确保它们可以通过web访问
        file_path = f"/file/{video.file_path}" if video.file_path else None
        
        # 智能处理缩略图路径
        pic_thumb_path = None
        if video.pic_thumb_path and os.path.exists(video.pic_thumb_path):
            # 如果数据库中的缩略图存在，直接使用
            pic_thumb_path = f"/file/{video.pic_thumb_path}"
        else:
            # 如果数据库中的缩略图不存在，尝试查找可能的缩略图文件
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
                            pic_thumb_path = f"/file/{path}"
                            print(f"找到替代缩略图: {path}")
                            break
        
        # 添加调试日志
        print(f"原始缩略图路径: {video.pic_thumb_path}")
        print(f"处理后的缩略图路径: {pic_thumb_path}")
        
        wav_path = f"/file/{video.wav_path}" if video.wav_path else None
        subtitle_en_json_path = f"/file/{video.subtitle_en_json_path}" if video.subtitle_en_json_path else None
        subtitle_zh_cn_json_path = f"/file/{video.subtitle_zh_cn_json_path}" if video.subtitle_zh_cn_json_path else None
        subtitle_en_ass_path = f"/file/{video.subtitle_en_ass_path}" if video.subtitle_en_ass_path else None
        subtitle_zh_cn_ass_path = f"/file/{video.subtitle_zh_cn_ass_path}" if video.subtitle_zh_cn_ass_path else None
        subtitle_en_md_path = f"/file/{video.subtitle_en_md_path}" if video.subtitle_en_md_path else None
        subtitle_zh_cn_md_path = f"/file/{video.subtitle_zh_cn_md_path}" if video.subtitle_zh_cn_md_path else None
        
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
                    "zh_md": subtitle_zh_cn_md_path
                }
            }
        )

# 添加通用文件访问路由
@app.get("/file/{file_path:path}")
async def read_file(file_path: str):
    """提供对任意文件的访问"""
    print(f"请求访问文件: {file_path}")  # 添加调试日志
    
    # 检查原始路径
    if os.path.exists(file_path):
        print(f"文件存在，返回: {file_path}")
        return FileResponse(file_path)
    
    # 尝试不同的路径组合
    alt_path = os.path.join(".", file_path)
    if os.path.exists(alt_path):
        print(f"替代路径存在，返回: {alt_path}")
        return FileResponse(alt_path)
    
    # 检查是否是缩略图请求
    if "thumbnail" in file_path:
        print(f"缩略图不存在，返回默认图片")
        # 返回默认缩略图
        default_thumbnail = "../frontend/assets/default-thumbnail.jpg"
        if os.path.exists(default_thumbnail):
            return FileResponse(default_thumbnail)
        else:
            # 如果默认缩略图不存在，创建一个
            try:
                os.makedirs("../frontend/assets", exist_ok=True)
                img = Image.new('RGB', (480, 270), color=(200, 200, 200))
                d = ImageDraw.Draw(img)
                d.text((240, 135), "No Thumbnail", fill=(80, 80, 80), anchor="mm")
                img.save(default_thumbnail)
                return FileResponse(default_thumbnail)
            except Exception as e:
                print(f"创建默认缩略图失败: {str(e)}")
    
    print(f"文件不存在: {file_path}")
    raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

@app.on_event("startup")
async def startup():
    """启动时初始化数据库"""
    app_logger.info("应用启动中...")
    try:
        init_db()
        app_logger.info("数据库初始化成功")
    except Exception as e:
        app_logger.error(f"数据库初始化失败: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown():
    """应用关闭时的清理工作"""
    app_logger.info("应用关闭中...")
    # 在这里添加任何需要的清理代码
    app_logger.info("应用已关闭")

@app.post("/process", 
    response_model=VideoResponse,
    summary="处理新视频",
    description="提交视频 URL，生成字幕和翻译"
)
async def process_video(video_req: VideoRequest):
    """
    处理视频并生成字幕:
    - 下载视频
    - 生成缩略图
    - 提取音频
    - 生成字幕
    - 翻译字幕
    - 生成双语字幕文件
    """
    try:
        app_logger.info(f"开始处理视频: {video_req.url}")
        video = processor.process_video(str(video_req.url))
        app_logger.info(f"视频处理成功: {video.hash_name}")
        return VideoResponse.from_db_model(video)
    except Exception as e:
        app_logger.error(f"视频处理失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-process", 
    response_model=List[VideoResponse],
    summary="批量处理视频",
    description="提交多个视频 URL，批量生成字幕和翻译"
)
async def batch_process_videos(batch_req: BatchVideoRequest):
    """
    批量处理视频并生成字幕:
    - 接收多个YouTube URL
    - 依次处理每个视频
    - 返回所有成功处理的视频信息
    """
    results = []
    errors = []
    
    for url in batch_req.urls:
        try:
            video = processor.process_video(str(url))
            results.append(VideoResponse.from_db_model(video))
        except Exception as e:
            errors.append({"url": str(url), "error": str(e)})
    
    if not results and errors:
        raise HTTPException(
            status_code=500, 
            detail={"message": "所有视频处理失败", "errors": errors}
        )
    
    # 如果有部分成功，部分失败，在响应头中添加警告
    if errors:
        return JSONResponse(
            content=[result.dict() for result in results],
            headers={"X-Processing-Errors": str(errors)}
        )
    
    return results

@app.get("/video/{hash_name}", 
    response_model=VideoResponse,
    summary="获取视频信息",
    description="通过 hash_name 获取视频处理信息"
)
async def get_video(
    hash_name: str = Path(..., description="视频的唯一 hash 标识")
):
    """获取已处理视频的信息"""
    video = processor.get_video_by_hash(hash_name)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return VideoResponse.from_db_model(video)

@app.get("/videos", 
    response_model=List[VideoResponse],
    summary="获取视频列表",
    description="获取所有已处理的视频列表"
)
async def list_videos(
    skip: int = Query(0, description="跳过的记录数"),
    limit: int = Query(10, description="返回的记录数")
):
    """获取视频列表，支持分页"""
    videos = processor.get_videos(skip=skip, limit=limit)
    return [VideoResponse.from_db_model(v) for v in videos]

@app.delete("/video/{hash_name}",
    response_model=dict,
    summary="删除视频",
    description="通过 hash_name 删除视频及其相关文件"
)
async def delete_video(
    hash_name: str = Path(..., description="视频的唯一 hash 标识")
):
    """删除视频及其相关文件"""
    success = processor.delete_video(hash_name)
    if not success:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"status": "success", "message": "Video deleted successfully"}

@app.get("/health",
    summary="健康检查",
    description="检查服务是否正常运行"
)
async def health_check():
    """服务健康检查"""
    return {"status": "healthy", "version": "0.0.9"}

@app.get("/video/{hash_name}/files/{file_type}",
    summary="下载视频相关文件",
    description="下载视频的字幕或音频文件"
)
async def download_file(
    hash_name: str = Path(..., description="视频的唯一 hash 标识"),
    file_type: Literal["subtitle_en", "subtitle_zh", "wav"] = Path(..., description="文件类型")
):
    """下载视频相关文件"""
    video = processor.get_video_by_hash(hash_name)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = None
    if file_type == "subtitle_en":
        file_path = video.subtitle_en_ass_path
    elif file_type == "subtitle_zh":
        file_path = video.subtitle_zh_cn_ass_path
    elif file_type == "wav":
        file_path = video.wav_path

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        filename=os.path.basename(file_path),
        media_type="application/octet-stream"
    )

# 添加根路径路由
@app.get("/")
async def read_index():
    return FileResponse("frontend/index.html")

@app.get("/video.html")
async def read_video():
    return FileResponse("frontend/video.html")

# 添加静态文件直接访问路由
@app.get("/app.js")
async def read_app_js():
    """提供前端JS文件"""
    return FileResponse("frontend/app.js")

@app.get("/video.js")
async def read_video_js():
    """提供视频页面JS文件"""
    return FileResponse("frontend/video.js")

@app.post("/video/{hash_name}/render-subtitle", 
    response_model=VideoResponse,
    summary="渲染字幕到视频",
    description="将字幕渲染到视频中，生成带有硬编码字幕的新视频文件"
)
async def render_subtitle_to_video(
    hash_name: str = Path(..., description="视频的唯一 hash 标识")
):
    """将字幕渲染到视频中"""
    try:
        # 获取视频信息
        video = processor.get_video_by_hash(hash_name)
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
            
        # 渲染字幕到视频
        rendered_video_path = processor.render_subtitle_to_video(hash_name)
        if not rendered_video_path:
            raise HTTPException(status_code=500, detail="字幕渲染失败")
            
        # 更新视频信息
        video.file_path = rendered_video_path
        processor.get_db_session().commit()
        
        # 返回更新后的视频信息
        return VideoResponse.from_db_model(video)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

@app.post("/upload", 
    response_model=VideoResponse,
    summary="上传本地视频",
    description="上传本地视频文件，生成字幕和翻译"
)
async def upload_video(
    video_file: UploadFile = File(..., description="视频文件"),
    title: str = Form(..., description="视频标题")
):
    """
    处理上传的本地视频并生成字幕:
    - 保存上传的视频文件
    - 生成缩略图
    - 提取音频
    - 生成字幕
    - 翻译字幕
    - 生成双语字幕文件
    """
    try:
        # 保存上传的视频文件到临时位置
        temp_file_path = f"temp/{video_file.filename}"
        os.makedirs(os.path.dirname(temp_file_path), exist_ok=True)
        
        with open(temp_file_path, "wb") as buffer:
            content = await video_file.read()
            buffer.write(content)
        
        # 处理本地视频文件
        video = processor.process_local_video(temp_file_path, title)
        
        # 处理完成后删除临时文件
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        return VideoResponse.from_db_model(video)
    except Exception as e:
        # 确保出错时也删除临时文件
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/video/{hash_name}/subtitles", 
    summary="获取视频字幕",
    description="根据语言检测获取视频字幕，如果是中文则渲染中文字幕，如果是英文则渲染中英双语字幕，并带上时间戳"
)
async def get_video_subtitles(
    hash_name: str = Path(..., description="视频的唯一 hash 标识")
):
    """获取视频字幕内容"""
    try:
        # 获取视频信息
        video = processor.get_video_by_hash(hash_name)
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
            
        # 检查字幕文件是否存在
        if not video.subtitle_en_json_path or not os.path.exists(video.subtitle_en_json_path):
            raise HTTPException(status_code=404, detail="英文字幕文件不存在")
            
        if not video.subtitle_zh_cn_json_path or not os.path.exists(video.subtitle_zh_cn_json_path):
            raise HTTPException(status_code=404, detail="中文字幕文件不存在")
            
        # 读取英文字幕文件
        with open(video.subtitle_en_json_path, 'r', encoding='utf-8') as f:
            en_data = json.load(f)
            
        # 读取中文字幕文件
        with open(video.subtitle_zh_cn_json_path, 'r', encoding='utf-8') as f:
            zh_data = json.load(f)
            
        # 检测语言
        language = en_data.get('language', 'en')
        
        # 准备字幕数据
        subtitles = []
        
        if language == 'zh':
            # 如果是中文，只渲染中文字幕
            for segment in zh_data.get('segments', []):
                subtitles.append({
                    'start': segment.get('start', 0),
                    'end': segment.get('end', 0),
                    'text': segment.get('text', '')
                })
        else:
            # 如果是英文，渲染中英双语字幕
            for segment in zh_data.get('segments', []):
                subtitles.append({
                    'start': segment.get('start', 0),
                    'end': segment.get('end', 0),
                    'text': segment.get('text', ''),
                    'translated_text': segment.get('translated_text', '')
                })
                
        return {
            'language': language,
            'subtitles': subtitles
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取字幕失败: {str(e)}")

@app.get("/video/data", 
    response_model=List[dict],
    summary="获取原始视频数据",
    description="获取数据库中的原始视频数据"
)
async def get_video_data(
    skip: int = Query(0, description="跳过的记录数"),
    limit: int = Query(100, description="返回的记录数")
):
    """获取数据库中的原始视频数据"""
    from sqlalchemy.orm import Session
    from models.database import SessionLocal, Video
    
    db = SessionLocal()
    try:
        videos = db.query(Video).offset(skip).limit(limit).all()
        # 将 SQLAlchemy 模型转换为字典
        result = []
        for video in videos:
            video_dict = {
                "id": video.id,
                "title": video.title,
                "url": video.url,
                "hash_name": video.hash_name,
                "folder_hash_name_path": video.folder_hash_name_path,
                "pic_thumb_path": video.pic_thumb_path,
                "file_path": video.file_path,
                "wav_path": video.wav_path,
                "subtitle_en_json_path": video.subtitle_en_json_path,
                "subtitle_zh_cn_json_path": video.subtitle_zh_cn_json_path,
                "subtitle_en_ass_path": video.subtitle_en_ass_path,
                "subtitle_zh_cn_ass_path": video.subtitle_zh_cn_ass_path,
                "subtitle_en_md_path": video.subtitle_en_md_path,
                "subtitle_zh_cn_md_path": video.subtitle_zh_cn_md_path,
                "created_at": video.created_at.isoformat() if video.created_at else None
            }
            result.append(video_dict)
        return result
    finally:
        db.close()

@app.get("/video/{hash_name}/thumbnail", 
    summary="获取视频缩略图",
    description="获取视频的缩略图"
)
async def get_video_thumbnail(
    hash_name: str = Path(..., description="视频的唯一 hash 标识")
):
    """获取视频的缩略图"""
    try:
        print(f"请求获取视频缩略图: {hash_name}")
        
        # 获取视频信息
        video = processor.get_video_by_hash(hash_name)
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        print(f"视频信息: {video.title}, 缩略图路径: {video.pic_thumb_path}, 文件夹路径: {video.folder_hash_name_path}")
        
        # 尝试获取缩略图
        if video.pic_thumb_path and os.path.exists(video.pic_thumb_path):
            print(f"使用数据库中的缩略图路径: {video.pic_thumb_path}")
            return FileResponse(video.pic_thumb_path)
        
        # 尝试直接使用hash_name构建路径
        direct_path = f"data/{hash_name}/original/thumbnail.jpg"
        if os.path.exists(direct_path):
            print(f"找到直接路径缩略图: {direct_path}")
            return FileResponse(direct_path)
            
        # 尝试使用相对路径
        relative_path = f"../data/{hash_name}/original/thumbnail.jpg"
        if os.path.exists(relative_path):
            print(f"找到相对路径缩略图: {relative_path}")
            return FileResponse(relative_path)
        
        # 如果数据库中的缩略图不存在，尝试查找可能的缩略图文件
        if video.folder_hash_name_path:
            original_dir = os.path.join(video.folder_hash_name_path, "original")
            print(f"尝试在目录中查找: {original_dir}")
            
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
                        print(f"找到替代缩略图: {path}")
                        return FileResponse(path)
        
        # 尝试在backend目录下查找
        backend_path = f"data/{hash_name}/original/thumbnail.jpg"
        if os.path.exists(backend_path):
            print(f"找到backend目录下的缩略图: {backend_path}")
            return FileResponse(backend_path)
        
        # 如果没有找到缩略图，返回默认图片
        default_thumbnail = "../frontend/public/static/assets/default-thumbnail.svg"
        if os.path.exists(default_thumbnail):
            print(f"使用默认缩略图: {default_thumbnail}")
            return FileResponse(default_thumbnail)
        
        # 如果默认缩略图也不存在，返回404
        raise HTTPException(status_code=404, detail="缩略图不存在")
    except Exception as e:
        print(f"获取缩略图失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取缩略图失败: {str(e)}")

@app.get("/direct-file/{path:path}", 
    summary="直接访问文件",
    description="通过路径直接访问文件"
)
async def get_direct_file(
    path: str = Path(..., description="文件路径")
):
    """直接通过路径访问文件"""
    try:
        print(f"请求直接访问文件: {path}")
        
        # 尝试多种可能的路径
        possible_paths = [
            path,
            f"../{path}",
            f"data/{path}",
            f"../data/{path}"
        ]
        
        for p in possible_paths:
            if os.path.exists(p):
                print(f"找到文件: {p}")
                return FileResponse(p)
        
        # 如果文件不存在，返回404
        raise HTTPException(status_code=404, detail="文件不存在")
    except Exception as e:
        print(f"访问文件失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"访问文件失败: {str(e)}")

@app.get("/video/{hash_name}/transcript/raw", 
    summary="获取视频原始转写JSON",
    description="获取WhisperX生成的原始转写JSON文件"
)
async def get_original_transcript(
    hash_name: str = Path(..., description="视频的唯一 hash 标识")
):
    """
    获取视频的原始转写JSON文件:
    - 查找视频记录
    - 检查原始转写JSON文件是否存在
    - 返回JSON文件内容
    """
    try:
        api_logger.info(f"请求获取视频原始转写: {hash_name}")
        
        # 获取视频信息
        video = processor.get_video_by_hash(hash_name)
        if not video:
            api_logger.warning(f"视频未找到: {hash_name}")
            raise HTTPException(status_code=404, detail=f"视频未找到: {hash_name}")
        
        api_logger.info(f"找到视频: {hash_name}, 标题: {video.title}")
        
        # 检查原始转写JSON文件是否存在
        json_path = None
        
        # 检查旧结构
        if video.subtitle_en_json_path and os.path.exists(video.subtitle_en_json_path):
            json_path = video.subtitle_en_json_path
            api_logger.info(f"使用旧结构的JSON路径: {json_path}")
        
        # 如果没有找到，检查可能的位置
        if not json_path and video.folder_hash_name_path:
            subtitles_dir = os.path.join(video.folder_hash_name_path, "subtitles")
            api_logger.info(f"检查字幕目录: {subtitles_dir}")
            
            if not os.path.exists(subtitles_dir):
                api_logger.warning(f"字幕目录不存在: {subtitles_dir}")
                os.makedirs(subtitles_dir, exist_ok=True)
                api_logger.info(f"创建字幕目录: {subtitles_dir}")
            
            possible_paths = [
                os.path.join(subtitles_dir, "whisperx.json"),  # 优先查找whisperx.json
                os.path.join(subtitles_dir, "en.json"),
                os.path.join(subtitles_dir, "original.json")
            ]
            
            for path in possible_paths:
                api_logger.info(f"检查可能的JSON路径: {path}")
                if os.path.exists(path):
                    json_path = path
                    api_logger.info(f"找到JSON文件: {json_path}")
                    break
        
        if not json_path:
            api_logger.warning(f"原始转写JSON文件未找到: {hash_name}")
            
            # 尝试创建一个空的JSON文件作为临时解决方案
            if video.folder_hash_name_path:
                subtitles_dir = os.path.join(video.folder_hash_name_path, "subtitles")
                os.makedirs(subtitles_dir, exist_ok=True)
                temp_json_path = os.path.join(subtitles_dir, "en.json")
                
                # 创建一个基本的空转写结果
                empty_transcript = {
                    "segments": [],
                    "language": "en"
                }
                
                with open(temp_json_path, 'w', encoding='utf-8') as f:
                    json.dump(empty_transcript, f, ensure_ascii=False, indent=4)
                
                api_logger.info(f"创建了临时JSON文件: {temp_json_path}")
                json_path = temp_json_path
            else:
                raise HTTPException(status_code=404, detail=f"原始转写JSON文件未找到: {hash_name}")
        
        # 读取JSON文件内容
        try:
            api_logger.info(f"读取JSON文件: {json_path}")
            with open(json_path, 'r', encoding='utf-8') as f:
                transcript_data = json.load(f)
                api_logger.info(f"成功读取JSON文件: {json_path}")
                return transcript_data
        except Exception as e:
            api_logger.error(f"读取JSON文件失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"读取JSON文件失败: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"获取原始转写失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# 前端日志模型
class FrontendLog(BaseModel):
    timestamp: str
    level: str
    message: str
    details: Optional[Dict[str, Any]] = None
    context: Optional[str] = None

@app.post("/api/logs", 
    summary="接收前端日志",
    description="接收并存储前端发送的日志"
)
async def receive_frontend_logs(log: FrontendLog = Body(...)):
    """接收前端日志并存储"""
    try:
        # 记录前端日志到后端日志文件
        log_message = f"Frontend Log [{log.level.upper()}] [{log.context or 'frontend'}]: {log.message}"
        
        # 根据日志级别选择不同的日志方法
        if log.level == "error":
            app_logger.error(log_message, exc_info=False)
        elif log.level == "warn":
            app_logger.warning(log_message)
        elif log.level == "debug":
            app_logger.debug(log_message)
        else:
            app_logger.info(log_message)
            
        # 如果有详细信息，也记录下来
        if log.details:
            app_logger.debug(f"Frontend Log Details: {json.dumps(log.details)}")
            
        return {"status": "success"}
    except Exception as e:
        app_logger.error(f"处理前端日志失败: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}
