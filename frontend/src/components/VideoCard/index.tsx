import React, { useMemo, useEffect, useState } from 'react';
import { Card, Typography, Image, message } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import { useHistory } from 'umi';
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
  hash_name?: string;
  onDelete?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  thumbnail,
  title,
  description,
  time,
  timestamp,
  source,
  hash_name,
  onDelete,
}) => {
  // 为每个卡片生成一个随机背景色
  const backgroundColor = useMemo(() => getRandomColor(), []);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const history = useHistory();
  
  // 调试缩略图
  useEffect(() => {
    if (thumbnail) {
      console.log('VideoCard 收到缩略图URL:', thumbnail);
      
      // 简化缩略图处理逻辑，直接使用占位符
      setImageError(true);
      console.log('使用占位符替代缩略图');
    } else {
      console.log('VideoCard 没有收到缩略图URL');
      setImageError(true);
    }
  }, [thumbnail]);
  
  // 添加状态来存储修正后的缩略图URL
  const [fixedThumbnailUrl, setFixedThumbnailUrl] = useState<string | undefined>(undefined);
  
  // 处理卡片点击事件
  const handleCardClick = () => {
    if (hash_name) {
      history.push(`/video/${hash_name}`);
    }
  };
  
  // 使用 Ant Design 的 Image 组件
  const renderThumbnail = () => {
    // 始终使用占位符，避免网络错误
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
    <Card 
      className={styles.videoCard} 
      bordered={false}
      onClick={handleCardClick}
      style={{ cursor: hash_name ? 'pointer' : 'default' }}
    >
      <div className={styles.thumbnailContainer}>
        <div className={styles.thumbnailOverlay}>
          <div className={styles.sourceButton}>
            <span>来自</span>
            <span>{source}</span>
          </div>
        </div>
        {onDelete && (
          <div 
            className={styles.deleteButton} 
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              onDelete();
            }}
          >
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