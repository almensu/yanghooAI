import os
import subprocess
import shutil
from pathlib import Path
from tkinter import filedialog, Tk
from typing import Optional, Union, List

def convert_video_to_wav(video_path: str, output_dir: str) -> str:
    """将视频转换为WAV音频"""
    try:
        # 使用固定的输出文件名
        output_path = os.path.join(output_dir, "audio.wav")
        
        cmd = [
            'ffmpeg', '-i', video_path,
            '-vn',  # 不处理视频
            '-acodec', 'pcm_s16le',  # 设置音频编码
            '-ar', '44100',  # 设置采样率
            '-ac', '2',  # 设置声道数
            '-y',  # 覆盖已存在的文件
            output_path
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        print(f'已转换: {os.path.basename(video_path)} -> audio.wav')
        return output_path
        
    except subprocess.CalledProcessError as e:
        print(f"转换失败: {e.stderr.decode()}")
        return None

if __name__ == "__main__":
    # 使用示例:
    result = convert_video_to_wav('single')  # 或 'multiple'
    if result:
        print(f"处理完成: {result}")
    else:
        print("处理失败或未选择文件")