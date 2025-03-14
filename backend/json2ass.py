import json
from langdetect import detect



def split_text(text, max_chars=50, min_chars=20):
    """Split text into smaller chunks based on punctuation and length"""
    print(f"\nSplitting text: {text}")  # 打印原始文本
    
    if len(text) <= max_chars:
        print(f"Text length ({len(text)}) <= max_chars ({max_chars}), returning as is")
        return [text]
    
    splits = []
    current = ""
    
    # Split on these punctuation marks
    delimiters = ['。', '，', '！', '？', ',', '.', '!', '?', ';', '；', ':', '-', ' ']
    
    for char in text:
        current += char
        if char in delimiters:
            if min_chars <= len(current) <= max_chars:
                print(f"Split at delimiter '{char}': {current.strip()}")
                splits.append(current.strip())
                current = ""
    
    # If there's a long remaining chunk, split it more aggressively
    if len(current) > max_chars:
        print(f"Splitting long remaining chunk: {current}")
        phrases = current.split()
        current_phrase = ""
        for phrase in phrases:
            if len(current_phrase + " " + phrase) <= max_chars:
                current_phrase += " " + phrase
            else:
                print(f"Split at phrase: {current_phrase.strip()}")
                splits.append(current_phrase.strip())
                current_phrase = phrase
        if current_phrase:
            print(f"Final phrase: {current_phrase.strip()}")
            splits.append(current_phrase.strip())
    
    if current:  # Add remaining text
        print(f"Adding remaining text: {current.strip()}")  # 打印剩余文本
        splits.append(current.strip())
    
    print(f"Final splits: {splits}\n")  # 打印最终结果
    return splits


# 配置字幕样式
CN_STYLE = {
    'name': 'CN',
    'fontname': 'Microsoft YaHei',
    'fontsize': 16,
    'color': '&H0080FFFF',  # 黄色
    'bold': 0,
    'alignment': 2,  # 8 顶部对齐 2 底部对齐
    'margin_v': 10
}

EN_STYLE = {
    'name': 'EN',
    'fontname': 'Arial',
    'fontsize': 12,
    'color': '&H00FFFFFF',  # 白色 (00=A, FF=B, FF=G, FF=R)
    'bold': 0,
    'alignment': 2,  # 底部对齐
    'margin_v': 10
}

def json_to_ass(json_file, output_file):
    # Extract base name without extension
    base_name = json_file.rsplit('.', 1)[0].replace('_en2cn', '')
    
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # ASS header with two styles
    ass_content = [
        "[Script Info]",
        f"Title: {base_name}",
        "ScriptType: v4.00+",
        "WrapStyle: 0",
        "ScaledBorderAndShadow: yes",
        "YCbCr Matrix: TV.601",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: {CN_STYLE['name']}, {CN_STYLE['fontname']}, {CN_STYLE['fontsize']}, {CN_STYLE['color']}, &H000000FF, &H00000000, &H00000000, {CN_STYLE['bold']}, 0, 0, 0, 100, 100, 0, 0, 1, 1, 0, {CN_STYLE['alignment']}, 10, 10, {CN_STYLE['margin_v']}, 1",
        f"Style: {EN_STYLE['name']}, {EN_STYLE['fontname']}, {EN_STYLE['fontsize']}, {EN_STYLE['color']}, &H000000FF, &H00000000, &H00000000, {EN_STYLE['bold']}, 0, 0, 0, 100, 100, 0, 0, 1, 1, 0, {EN_STYLE['alignment']}, 10, 10, {EN_STYLE['margin_v']}, 1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
    ]

    # Convert segments to ASS format
    for segment in data['segments']:
        start_time = segment['start']
        end_time = segment['end']
        
        # 分别处理中英文字幕，不强制对齐数量
        cn_parts = split_text(segment['translated_text'], max_chars=50)
        en_parts = split_text(segment['text'], max_chars=30)  # 英文可以更短一些
        
        # 计算每个部分的时长比例
        cn_total_chars = sum(len(text) for text in cn_parts)
        en_total_chars = sum(len(text) for text in en_parts)
        
        # 分别处理中英文时间轴
        duration = end_time - start_time
        
        # 处理中文字幕
        cn_time_start = start_time
        for i, cn_text in enumerate(cn_parts):
            cn_text = cn_text.replace('\n', '\\N')
            part_duration = (len(cn_text) / cn_total_chars) * duration if cn_total_chars > 0 else duration
            cn_time_end = cn_time_start + max(part_duration, 1)  # 最少1秒
            
            if i == len(cn_parts) - 1:
                cn_time_end = end_time
                
            ass_content.append(f"Dialogue: 0,{format_time(cn_time_start)},{format_time(cn_time_end)},{CN_STYLE['name']},,0,0,0,,{cn_text}")
            cn_time_start = cn_time_end
        
        # 处理英文字幕
        en_time_start = start_time
        for i, en_text in enumerate(en_parts):
            en_text = en_text.replace('\n', '\\N')
            part_duration = (len(en_text) / en_total_chars) * duration if en_total_chars > 0 else duration
            en_time_end = en_time_start + max(part_duration, 1)  # 最少1秒
            
            if i == len(en_parts) - 1:
                en_time_end = end_time
                
            ass_content.append(f"Dialogue: 0,{format_time(en_time_start)},{format_time(en_time_end)},{EN_STYLE['name']},,0,0,0,,{en_text}")
            en_time_start = en_time_end

    # Write to ASS file
    with open(output_file, 'w', encoding='utf-8') as ass_file:
        ass_file.write('\n'.join(ass_content))
    
    print(f"ASS file generated: {output_file}")

def format_time(seconds):
    """ Convert seconds to ASS time format (H:MM:SS.CC) """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = seconds % 60
    return f"{hours}:{minutes:02}:{seconds:05.2f}"

def merge_short_lines(lines):
    """合并过短的相邻行"""
    merged = []
    buffer = []
    
    for line in lines:
        if not buffer:
            buffer.append(line)
            continue
            
        prev = buffer[-1]
        # 如果当前行和前一行时间相连且同属一种语言
        if (abs(prev['end'] - line['start']) < 0.1 and 
            prev['text'].strip() and
            line['text'].strip() and
            prev['lang'] == line['lang']):
            # 合并文本,保留较早的开始时间和较晚的结束时间
            prev['text'] += ' ' + line['text'] 
            prev['end'] = line['end']
        else:
            merged.extend(buffer)
            buffer = [line]
            
    merged.extend(buffer)
    return merged

def align_cn_en_times(lines):
    """对齐中英文字幕的时间戳"""
    aligned = []
    en_lines = {}
    
    # 先收集所有英文行的时间戳
    for line in lines:
        if line['lang'] == 'EN':
            key = f"{line['start']:.2f}"
            en_lines[key] = line['end']
    
    # 对中文行应用对应的英文时间戳        
    for line in lines:
        if line['lang'] == 'CN':
            key = f"{line['start']:.2f}"
            if key in en_lines:
                line['end'] = en_lines[key]
        aligned.append(line)
        
    return aligned

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = input_file.rsplit('.', 1)[0] + '.ass'
        json_to_ass(input_file, output_file)
    else:
        print("Usage: python json2ass.py input.json")
