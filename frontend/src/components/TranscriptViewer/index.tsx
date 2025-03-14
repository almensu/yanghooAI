import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Alert, Divider, Tag, Tooltip, Space } from 'antd';
import { getOriginalTranscript } from '@/services/video';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

interface Word {
  word: string;
  start: number;
  end: number;
  score?: number;
}

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: Word[];
}

interface TranscriptData {
  segments: Segment[];
  language: string;
}

interface TranscriptViewerProps {
  hashName: string;
}

// 格式化时间为 MM:SS.ms 格式
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
};

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ hashName }) => {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setLoading(true);
        const data = await getOriginalTranscript(hashName);
        setTranscript(data);
        setError(null);
      } catch (err) {
        console.error('获取转写失败:', err);
        setError('获取转写数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    if (hashName) {
      fetchTranscript();
    }
  }, [hashName]);

  if (loading) {
    return (
      <Card className={styles.transcriptCard}>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>加载转写数据中...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.transcriptCard}>
        <Alert
          message="获取转写失败"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!transcript) {
    return (
      <Card className={styles.transcriptCard}>
        <Alert
          message="无转写数据"
          description="未找到转写数据"
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card className={styles.transcriptCard} title="WhisperX 语音转写结果 (AI自动生成)">
      <div className={styles.transcriptHeader}>
        <Space>
          <Tag color="blue">语言: {transcript.language}</Tag>
          <Tag color="green">段落数: {transcript.segments.length}</Tag>
        </Space>
      </div>

      <Divider />

      <div className={styles.transcriptContent}>
        {transcript.segments.map((segment, index) => (
          <div key={index} className={styles.segment}>
            <div className={styles.segmentHeader}>
              <Tag color="purple">{formatTime(segment.start)} - {formatTime(segment.end)}</Tag>
            </div>
            
            <Paragraph className={styles.segmentText}>
              {segment.words ? (
                <span>
                  {segment.words.map((word, wordIndex) => (
                    <Tooltip 
                      key={wordIndex} 
                      title={`${formatTime(word.start)} - ${formatTime(word.end)}${word.score ? ` (置信度: ${(word.score * 100).toFixed(1)}%)` : ''}`}
                    >
                      <span className={styles.word}>
                        {word.word}{' '}
                      </span>
                    </Tooltip>
                  ))}
                </span>
              ) : (
                <span>{segment.text}</span>
              )}
            </Paragraph>
            
            {index < transcript.segments.length - 1 && <Divider dashed />}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TranscriptViewer; 