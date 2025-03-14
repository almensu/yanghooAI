import whisperx
import os
import json

# 设置路径
audio_path = 'data/9a4a7dc8ff6c6770436b990ce23a5a6e/original/audio.wav'
output_dir = 'data/9a4a7dc8ff6c6770436b990ce23a5a6e/subtitles'

# 设置设备
device = 'cpu'
compute_type = 'int8'

# 加载音频
print(f"Loading audio from {audio_path}")
audio = whisperx.load_audio(audio_path)

# 加载模型并进行初始转写
print("Loading model and transcribing")
model = whisperx.load_model('large-v3', device, compute_type=compute_type)
result = model.transcribe(audio, batch_size=8)
print(f"Initial transcription done, language: {result['language']}")

# 加载对齐模型并进行单词级别对齐
print("Loading alignment model")
align_model, align_metadata = whisperx.load_align_model(
    language_code=result['language'],
    device=device
)

# 进行单词级别对齐
print("Performing word-level alignment")
result = whisperx.align(
    result['segments'],
    align_model,
    align_metadata,
    audio,
    device,
    return_char_alignments=False
)
print("Alignment done")

# 打印第一个段落的信息
print("\nFirst segment:")
print(json.dumps(result['segments'][0], indent=2, ensure_ascii=False))

# 保存结果
output_file = os.path.join(output_dir, 'en_with_words.json')
print(f"\nSaving results to {output_file}")
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=4)
print("JSON saved") 