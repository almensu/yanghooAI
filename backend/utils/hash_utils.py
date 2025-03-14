import hashlib
import os
from urllib.parse import urlparse

def generate_hash_name(url: str) -> str:
    """从URL生成唯一hash值"""
    parsed = urlparse(url)
    # 对于YouTube URL，使用视频ID部分
    if 'youtube.com' in parsed.netloc or 'youtu.be' in parsed.netloc:
        if 'v=' in url:
            video_id = url.split('v=')[1].split('&')[0]
        else:
            video_id = parsed.path.split('/')[-1]
        return hashlib.md5(video_id.encode()).hexdigest()
    # 其他URL使用完整URL生成hash
    return hashlib.md5(url.encode()).hexdigest()

def create_hash_folder(hash_name: str, base_path: str = "data") -> str:
    """创建基于hash的文件夹结构"""
    folder_path = os.path.join(base_path, hash_name)
    os.makedirs(folder_path, exist_ok=True)
    return folder_path 