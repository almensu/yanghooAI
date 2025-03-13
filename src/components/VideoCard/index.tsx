import React from 'react';
import { Card, Typography } from 'antd';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

interface VideoCardProps {
  thumbnail?: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  source: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  thumbnail,
  title,
  description,
  time,
  timestamp,
  source,
}) => {
  return (
    <Card className={styles.videoCard} bordered={false}>
      <div className={styles.thumbnailContainer}>
        <div className={styles.thumbnailOverlay}>
          <div className={styles.sourceButton}>
            <span>来自</span>
            <span>{source}</span>
          </div>
        </div>
        <div className={styles.thumbnail} style={{ backgroundColor: '#D9D9D9' }} />
      </div>
      <div className={styles.content}>
        <div className={styles.timeInfo}>
          <Text className={styles.time}>{time}</Text>
          <Text className={styles.timestamp}>{timestamp}</Text>
        </div>
        <div>
          <Title level={5} className={styles.title}>{title}</Title>
          <Paragraph className={styles.description} ellipsis={{ rows: 2 }}>
            {description}
          </Paragraph>
        </div>
      </div>
    </Card>
  );
};

export default VideoCard; 