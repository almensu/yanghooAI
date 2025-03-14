# 数据目录检查记录
日期：2024-03-06

## 数据库记录

```sql
SELECT hash_name, title FROM video;
```

当前记录：
- `d96843ec85fb47154f0f05649d1dfa9f`: "Steve Jobs Secrets of Life"
- `055776e87258ba01135e898927ec8420`: "I Love This Cursor Feature + AI 2025 Channel Plans"

## 数据目录结构

data目录包含3个hash文件夹：
- `d96843ec85fb47154f0f05649d1dfa9f` ✅ (在数据库中)
- `055776e87258ba01135e898927ec8420` ✅ (在数据库中)
- `fced3c3b12bddc5df0e6d18a31459255` ❌ (不在数据库中)

### 标准目录结构
每个视频文件夹都包含：
- `original/`: 原始视频和缩略图
- `docs/`: 文档文件
- `subtitles/`: 字幕文件

## 不匹配文件夹详细检查

文件夹: `fced3c3b12bddc5df0e6d18a31459255`

### Original目录内容:
- video.mp4 (9.1MB) - 创建于12月13日
- audio.wav (48MB) - 创建于3月6日
- thumbnail.jpg (16KB)
- thumbnail.webp.webp (38KB)

### Subtitles目录内容:
- en.json (4.9KB)
- zh.json (9.2KB)
- bilingual.ass (19KB)

### Docs目录内容:
- en.md (3.6KB)
- zh.md (3.8KB)
- bilingual.md (7.9KB)

### 视频内容信息
根据文档内容，这是一个关于 **ExitChatGPT 更新功能介绍** 的视频。

### 时间线分析
- 原始视频文件 (video.mp4) 创建于 12月13日
- 其他处理文件（字幕、音频等）创建于 3月6日
- 表明这是一个最近（3月6日）处理的视频

## 问题分析

1. 数据不一致：
   - 数据库中有2条记录
   - 实际文件系统中有3个视频文件夹
   - 多出的文件夹处理流程完整，但未在数据库中记录

2. 可能原因：
   - 新添加的视频还未同步到数据库
   - 之前的视频记录被删除但文件夹未清理
   - 处理过程中断导致的不一致

## 建议操作

1. 对于不匹配文件夹 `fced3c3b12bddc5df0e6d18a31459255`：
   - 将视频信息添加到数据库中（推荐）
   - 或如果是测试数据，可以安全删除该目录

2. 长期建议：
   - 添加定期清理机制
   - 确保data目录和数据库保持同步
   - 添加数据一致性检查工具 