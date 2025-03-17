import whisperx
import json
import os
import torch

class VideoProcessor:
    def process_whisperx(self, video):
        """使用 WhisperX 处理音频，生成带单词级别时间戳的字幕"""
        try:
            # 确保音频文件存在
            if not video.wav_path or not os.path.exists(video.wav_path):
                raise Exception("音频文件不存在")

            # 设置输出目录
            output_dir = os.path.join(os.path.dirname(video.wav_path), "..", "subtitles")
            os.makedirs(output_dir, exist_ok=True)

            # 设置设备
            device = "cuda" if torch.cuda.is_available() else "cpu"
            compute_type = "float16" if device == "cuda" else "int8"

            # 加载音频
            audio = whisperx.load_audio(video.wav_path)

            # 加载模型并进行初始转写
            model = whisperx.load_model("large-v3", device, compute_type=compute_type)
            result = model.transcribe(audio, batch_size=16)

            # 加载对齐模型并进行单词级别对齐
            align_model, align_metadata = whisperx.load_align_model(
                language_code=result["language"],
                device=device
            )

            # 进行单词级别对齐
            result = whisperx.align(
                result["segments"],
                align_model,
                align_metadata,
                audio,
                device,
                return_char_alignments=False
            )

            # 保存结果
            output_file = os.path.join(output_dir, "en_with_words.json")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=4)

            # 更新数据库记录
            video.subtitle_en_with_words_json_path = output_file
            self.db.commit()

            return output_file

        except Exception as e:
            self.logger.error(f"WhisperX处理失败: {str(e)}", exc_info=True)
            raise

    def process_video(self, url: str) -> Video:
        """处理视频，包括下载、提取音频、生成字幕等"""
        try:
            # ... existing code ...
            
            # 在生成普通字幕之后，添加 WhisperX 处理
            if video.wav_path and os.path.exists(video.wav_path):
                self.process_whisperx(video)
            
            return video
            
        except Exception as e:
            self.logger.error(f"视频处理失败: {str(e)}", exc_info=True)
            raise 