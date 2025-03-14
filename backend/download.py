import re
import subprocess
import os
import shutil
import logging
import yt_dlp
from pathlib import Path

def get_video_source(url):
    if re.match(r"https?://(?:www\.)?youtu(?:be\.com/watch\?v=|\.be/)([\w\-_]*)(&(amp;)?‌​[\w?‌​=]*)?", url):
        return "youtube"
    elif re.match(r"https?://(?:www\.)?twitter\.com/\w+/status/\d+", url):
        return "twitter"
    elif re.match(r"https?://x\.com/i/status/\d+", url):
        return "twitter"
    elif re.match(r"https?://(?:www\.)?xiaoyuzhoufm\.com/episode/[\w\-]+", url):
        return "xiaoyuzhou"
    return None

def download_video_yt(url, quality=None, batch_mode=False):
    if quality is None and not batch_mode:
        print("请选择视频质量:")
        print("1. 最佳质量")
        print("2. 720p (默认)")
        choice = input("请输入选项编号 (1 或 2): ")
        if choice == "1":
            quality = "best"
        else:
            quality = "720p"
    elif batch_mode:
        quality = "720p"

    if quality == "best":
        cmd = f'yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 "{url}"'
    elif quality == "720p":
        cmd = f'yt-dlp -f "bv*[height<=720]+ba" --merge-output-format mp4 "{url}"'
    else:
        raise ValueError(f"Unsupported quality: {quality}")
    
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    output, _ = process.communicate()
    
    if process.returncode != 0:
        raise RuntimeError(f"Failed to download video: {output}")
    
    video_path = None
    for line in output.split("\n"):
        if line.startswith("[Merger] Merging formats into "):
            video_path = line.split("into ")[1].strip('"')
            break
    
    if video_path is None:
        raise FileNotFoundError("Could not determine downloaded video file path")
    
    return video_path

def download_video_twitter(url):
    # 在 yt-dlp 命令中添加 -o "%(id).30s.%(ext)s" 参数,指定输出文件名格式为视频ID和扩展名。这样可以避免默认的长文件名。
    # yt-dlp -o '%(title).50s.%(ext)s' "https://x.com/i/status/1869319333954089218"
    cmd = f'yt-dlp -f "bv[height=720][ext=mp4]+ba[ext=m4a]/b" -o "%(title).30s.%(ext)s" "{url}"'
    
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    output, _ = process.communicate()
    
    if process.returncode != 0:
        raise RuntimeError(f"Failed to download video: {output}")
    
    video_path = None
    for line in output.split("\n"):
        if line.startswith("[download] Destination: "):
            video_path = line.split("Destination: ")[1].strip()
            break
    
    if video_path is None:
        raise FileNotFoundError("Could not determine downloaded video file path")
    
    return video_path

def download_video_xiaoyuzhou(url):
    cmd = f'yt-dlp --extract-audio "{url}"'
    
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    output, _ = process.communicate()
    
    if process.returncode != 0:
        raise RuntimeError(f"Failed to download audio: {output}")
    
    audio_path = None
    for line in output.split("\n"):
        if line.startswith("[download] Destination: "):
            audio_path = line.split("Destination: ")[1].strip()
            break
    
    if audio_path is None:
        raise FileNotFoundError("Could not determine downloaded audio file path")
    
    return audio_path

def save_video(url, quality="720p", path="downloads/videos"):
    source = get_video_source(url)
    if source == "youtube":
        video_file = download_video_yt(url, quality)
    elif source == "twitter":
        video_file = download_video_twitter(url)
    elif source == "xiaoyuzhou":
        video_file = download_video_xiaoyuzhou(url)
    else:
        raise ValueError(f"Unsupported video source: {source}")
    
    # Create target directory if it doesn't exist
    os.makedirs(path, exist_ok=True)
    
    # Move video file to target directory
    final_path = os.path.join(path, os.path.basename(video_file))
    shutil.move(video_file, final_path)
    return final_path

def generate_thumbnail(video_path: str, output_dir: str) -> str:
    """生成视频缩略图
    
    Args:
        video_path: 视频文件路径
        output_dir: 输出目录
        
    Returns:
        缩略图路径
    """
    thumbnail_path = os.path.join(output_dir, f"{os.path.splitext(os.path.basename(video_path))[0]}_thumb.jpg")
    
    cmd = [
        'ffmpeg', '-i', video_path,
        '-ss', '00:00:02',  # 2秒处截图
        '-vframes', '1',
        '-s', '320x180',
        '-y',
        thumbnail_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return thumbnail_path
    except subprocess.CalledProcessError as e:
        logging.error(f"缩略图生成失败: {e.stderr.decode()}")
        return None

def download_video(url: str, output_dir: str) -> dict:
    """
    下载YouTube视频和缩略图
    返回包含视频路径和缩略图路径的字典
    """
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 配置yt-dlp选项
    ydl_opts = {
        'format': 'best[height<=720]',  # 720p或更低
        'outtmpl': {
            'default': os.path.join(output_dir, 'video.mp4'),
            'thumbnail': os.path.join(output_dir, 'thumbnail.webp')
        },
        'writethumbnail': True,
        'quiet': False,
        'no_warnings': True,
        'extract_flat': False,
        'writesubtitles': False
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 下载视频
            info = ydl.extract_info(url, download=True)
            
            # 返回文件路径
            return {
                'video_path': os.path.join(output_dir, 'video.mp4'),
                'thumbnail_path': os.path.join(output_dir, 'thumbnail.webp'),
                'title': info.get('title', '')
            }
            
    except Exception as e:
        print(f"下载失败: {str(e)}")
        return None

def download_videos_from_file(links_file):
    """Download videos from URLs listed in a file"""
    video_dir = "downloads/videos"
    os.makedirs(video_dir, exist_ok=True)
    
    with open(links_file, 'r') as f:
        urls = [line.strip() for line in f if line.strip()]
        
    video_files = []
    for url in urls:
        try:
            video_file = download_video(url, batch_mode=True)
            video_files.append(video_file)
        except Exception as e:
            logging.error(f"Failed to download {url}: {str(e)}")
            
    return video_files

if __name__ == "__main__":
    url = input("请输入要下载的视频链接: ")
    save_video(url)


