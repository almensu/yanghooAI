import os
import re
from pathlib import Path
import time
import json
import logging
from typing import Optional
from langdetect import detect

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def is_english_content(content: str) -> bool:
    """检查内容是否为英文"""
    try:
        # 获取前500个字符进行语言检测
        sample = content[:500]
        return detect(sample) == 'en'
    except:
        # 如果检测失败，默认为非英文
        return False

def get_ollama_response(prompt: str, model: str = "qwen2.5:7b") -> Optional[str]:
    """使用 Ollama API 获取响应"""
    import requests
    
    try:
        response = requests.post('http://localhost:11434/api/generate',
            json={
                'model': model,
                'prompt': prompt,
                'stream': False
            },
            timeout=60
        )
        response.raise_for_status()
        return response.json()['response']
    except Exception as e:
        logging.error(f"Ollama API 调用失败: {str(e)}")
        return None

def translate_content(content: str, model: str = "qwen2.5:7b") -> Optional[str]:
    """翻译内容"""
    prompt = f"""请将以下英文内容翻译成中文，保持原有的markdown格式：

{content}

只需要返回翻译后的中文内容，不要添加任何其他解释。
"""
    return get_ollama_response(prompt, model)

def process_file(filepath: str, model: str) -> None:
    """处理单个文件"""
    try:
        # 读取内容
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否为英文内容
        if not is_english_content(content):
            logging.warning(f"跳过非英文文件: {filepath}")
            return
        
        # 翻译内容
        translated_content = translate_content(content, model)
        if not translated_content:
            logging.error(f"翻译失败: {filepath}")
            return
        
        # 生成中文文件路径
        if '_en.md' in filepath:
            output_path = filepath.replace('_en.md', '_zh.md')
        elif '_en_summarize.md' in filepath:
            output_path = filepath.replace('_en_summarize.md', '_zh_summarize.md')
        elif '_en_insight.md' in filepath:
            output_path = filepath.replace('_en_insight.md', '_zh_insight.md')
        else:
            logging.error(f"无法确定输出路径: {filepath}")
            return
        
        # 保存翻译结果
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        
        logging.info(f"已生成翻译文件: {output_path}")
        
    except Exception as e:
        logging.error(f"处理文件时出错 {filepath}: {str(e)}")

def translate_markdown_files(directory: str = "output", model: str = "qwen2.5:7b") -> None:
    """批量处理目录中的非英文 markdown 文件"""
    try:
        # 确保输出目录存在
        os.makedirs(directory, exist_ok=True)
        
        # 查找所有英文相关的 markdown 文件模式
        patterns = [
            r'_en\.md$',           # 基础英文文件
            r'_en_summarize\.md$', # 英文总结
            r'_en_insight\.md$'    # 英文洞察
        ]
        
        en_files = []
        for file in os.listdir(directory):
            for pattern in patterns:
                if re.search(pattern, file):
                    en_files.append(os.path.join(directory, file))
        
        if not en_files:
            logging.warning(f"未找到英文相关的 markdown 文件在目录: {directory}")
            return
            
        # 处理每个文件
        for filepath in en_files:
            # 根据文件类型生成对应的中文文件名
            if '_en.md' in filepath:
                zh_path = filepath.replace('_en.md', '_zh.md')
            elif '_en_summarize.md' in filepath:
                zh_path = filepath.replace('_en_summarize.md', '_zh_summarize.md')
            elif '_en_insight.md' in filepath:
                zh_path = filepath.replace('_en_insight.md', '_zh_insight.md')
            
            # 如果中文文件不存在，则处理
            if not os.path.exists(zh_path):
                process_file(filepath, model)
            else:
                logging.info(f"中文文件已存在，跳过: {zh_path}")
            
            # 添加短暂延迟，避免���求过于频繁
            time.sleep(1)
            
    except Exception as e:
        logging.error(f"处理目录时出错 {directory}: {str(e)}")

if __name__ == "__main__":
    # 可以直接运行此文件进行测试
    translate_markdown_files() 