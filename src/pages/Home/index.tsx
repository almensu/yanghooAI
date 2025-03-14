import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Alert, Spin, message } from 'antd';
import VideoCard from '@/components/VideoCard';
import { getVideos, Video } from '@/services/video';
import styles from './index.less';

const { Title } = Typography;

const HomePage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getVideos();
        setVideos(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleDelete = (id: string) => {
    setVideos(videos.filter(video => video.id !== id));
    message.success('视频已删除');
  };

  return (
    <div className={styles.homePage}>
      <div className={styles.welcomeContainer}>
        <Title level={2} className={styles.welcomeTitle}>
          欢迎使用 YanghooAI 视频App
        </Title>
        
        <Alert
          message="支持 YouTube、Podcast 链接"
          type="info"
          className={styles.supportAlert}
          showIcon={false}
        />
      </div>
      
      <div className={styles.videoGrid}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        ) : (
          videos.map(video => (
            <VideoCard
              key={video.id}
              title={video.title}
              description={video.description}
              time={video.time}
              timestamp={video.timestamp}
              source={video.source}
              thumbnail={video.thumbnail}
              onDelete={() => handleDelete(video.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage; 