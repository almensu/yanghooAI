import json
import os

def process_json_files(hash_name: str, output_dir: str) -> None:
    """处理JSON文件并生成MD文件"""
    # 构建输入文件路径
    json_file = os.path.join(output_dir, "../subtitles/zh.json")  # 使用相对路径访问字幕文件
    
    # 检查文件是否存在
    if not os.path.exists(json_file):
        raise FileNotFoundError(f"File not found: {json_file}")
    
    # 读取JSON文件
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 生成英文MD文件
    en_md_path = os.path.join(output_dir, "en.md")
    with open(en_md_path, 'w', encoding='utf-8') as f:
        f.write("# English Subtitle\n\n")
        for segment in data['segments']:
            f.write(f"{segment['text']}\n\n")
    
    # 生成中文MD文件
    zh_md_path = os.path.join(output_dir, "zh.md")
    with open(zh_md_path, 'w', encoding='utf-8') as f:
        f.write("# 中文字幕\n\n")
        for segment in data['segments']:
            if 'translated_text' in segment:
                f.write(f"{segment['translated_text']}\n\n")
    
    # 生成双语MD文件
    bilingual_md_path = os.path.join(output_dir, "bilingual.md")
    with open(bilingual_md_path, 'w', encoding='utf-8') as f:
        f.write("# Bilingual Subtitle 双语字幕\n\n")
        for segment in data['segments']:
            f.write(f"**English**: {segment['text']}\n\n")
            if 'translated_text' in segment:
                f.write(f"**中文**: {segment['translated_text']}\n\n")
            f.write("---\n\n")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python generate_md.py <hash_name> <output_dir>")
        sys.exit(1)
    
    hash_name = sys.argv[1]
    output_dir = sys.argv[2]
    process_json_files(hash_name, output_dir)
