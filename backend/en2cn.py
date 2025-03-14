import requests
import json
import os
import glob
from langdetect import detect

def load_json(filename):
    with open(filename, 'r', encoding='utf-8') as file:
        data = json.load(file)
    return data

def translate_text(text, model='qwen2.5:0.5b'):
    """使用 Ollama API 翻译文本"""
    lang = detect(text)
    
    if lang == 'zh-cn':
        return text
        
    # 准备请求数据
    data = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "你是一个专业的翻译助手，请将英文翻译成中文，要求译文通顺自然。只返回翻译结果，不要返回任何其他内容。"
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "stream": False
    }
    
    try:
        # 发送请求到 Ollama API
        response = requests.post(
            "http://localhost:11434/api/chat",
            json=data,
            timeout=30
        )
        response.raise_for_status()
        
        # 解析响应
        result = response.json()
        return result['message']['content'].strip()
        
    except Exception as e:
        print(f"翻译出错: {str(e)}")
        return text  # 出错时返回原文

def translate_json_file(json_file, output_dir="output"):
    # Load JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    # Process translations and save directly
    for segment in json_data['segments']:
        translated_text = translate_text(segment['text'])
        segment['translated_text'] = translated_text
    
    # Generate output path
    base_name = os.path.splitext(os.path.basename(json_file))[0]
    if base_name.endswith('_wav_to_txt'):
        base_name = base_name[:-11]
    output_file = os.path.join(output_dir, f"{base_name}_en2cn.json")
    
    # Save the data
    os.makedirs(output_dir, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=4)
    
    print(f"Translation completed and saved to {output_file}")
    return output_file

if __name__ == "__main__":
    import sys
    
    # 获取output目录下所有的*_wav_to_txt.json文件
    available_files = glob.glob('output/*_wav_to_txt.json')
    
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    elif available_files:
        input_file = available_files[0]
    else:
        print("Error: No *_wav_to_txt.json files found in output directory")
        sys.exit(1)
        
    translate_json_file(input_file)