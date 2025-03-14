import React, { useMemo, useEffect, useState } from 'react';
import { Card, Typography, Image, message } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

// 生成随机颜色
const getRandomColor = () => {
  const colors = [
    '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#eb2f96', '#fa8c16', '#a0d911', '#fadb14'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 默认图片
interface VideoCardProps {
  thumbnail?: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  source: string;
  onDelete?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  thumbnail,
  title,
  description,
  time,
  timestamp,
  source,
  onDelete,
}) => {
  // 为每个卡片生成一个随机背景色
  const backgroundColor = useMemo(() => getRandomColor(), []);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 调试缩略图
  useEffect(() => {
    if (thumbnail) {
      console.log('VideoCard 收到缩略图URL:', thumbnail);
      
      // 尝试修复缩略图URL
      let fixedThumbnail = thumbnail;
      
      if (thumbnail.startsWith('/file/')) {
        // 如果是/file/开头，添加API前缀
        fixedThumbnail = `http://localhost:8000${thumbnail}`;
        console.log('修正后的缩略图URL:', fixedThumbnail);
      } else if (thumbnail.startsWith('/api/file/')) {
        // 如果是/api/file/开头，替换为正确的URL
        fixedThumbnail = `http://localhost:8000${thumbnail.replace('/api/file/', '/file/')}`;
        console.log('修正后的缩略图URL:', fixedThumbnail);
      }
      
      // 测试图片是否可以加载
      const img = new globalThis.Image();
      img.onload = () => {
        console.log('缩略图加载成功:', fixedThumbnail);
        setImageLoaded(true);
        setImageError(false);
        
        // 如果URL被修正了，更新组件状态
        if (fixedThumbnail !== thumbnail) {
          setFixedThumbnailUrl(fixedThumbnail);
        }
      };
      img.onerror = (e) => {
        console.error('缩略图加载失败:', fixedThumbnail, e);
        setImageError(true);
      };
      img.src = fixedThumbnail;
    } else {
      console.log('VideoCard 没有收到缩略图URL');
    }
  }, [thumbnail]);
  
  // 添加状态来存储修正后的缩略图URL
  const [fixedThumbnailUrl, setFixedThumbnailUrl] = useState<string | undefined>(undefined);
  
  // 使用 Ant Design 的 Image 组件
  const renderThumbnail = () => {
    // 使用修正后的URL或原始URL
    const displayThumbnail = fixedThumbnailUrl || thumbnail;
    
    if (displayThumbnail && !imageError) {
      return (
        <div className={styles.thumbnailWrapper}>
          <Image
            src={displayThumbnail}
            alt={title}
            className={styles.thumbnailImage}
            preview={false}
            onError={(e) => {
              console.error('图片加载错误，使用背景色替代:', displayThumbnail);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.style.backgroundColor = backgroundColor;
            }}
          />
        </div>
      );
    }
    
    return (
      <div 
        className={styles.thumbnailPlaceholder} 
        style={{ backgroundColor }}
      >
        <PlayCircleOutlined style={{ fontSize: 32, color: 'rgba(255, 255, 255, 0.8)' }} />
      </div>
    );
  };
  
  return (
    <Card className={styles.videoCard} bordered={false}>
      <div className={styles.thumbnailContainer}>
        <div className={styles.thumbnailOverlay}>
          <div className={styles.sourceButton}>
            <span>来自</span>
            <span>{source}</span>
          </div>
        </div>
        {onDelete && (
          <div className={styles.deleteButton} onClick={onDelete}>
            <DeleteOutlined />
          </div>
        )}
        {renderThumbnail()}
      </div>
      <div className={styles.content}>
        <div className={styles.timeInfo}>
          <Text className={styles.time}>{time || '未知时间'}</Text>
          <Text className={styles.timestamp}>{timestamp || '--:--'}</Text>
        </div>
        <div>
          <Title level={5} className={styles.title}>{title || '未命名视频'}</Title>
          <Paragraph className={styles.description} ellipsis={{ rows: 2 }}>
            {description || '无描述信息'}
          </Paragraph>
        </div>
      </div>
    </Card>
  );
};

export default VideoCard; 