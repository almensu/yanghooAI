import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Alert, Spin, message, Input, Button, Badge, Tooltip } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import VideoCard from '@/components/VideoCard';
import { getVideos, deleteVideo, addVideo, VideoDisplay, getVideoDataForHome, getVideosCount } from '@/services/video';
import styles from './index.less';

const { Title } = Typography;
const { Search } = Input;

const HomePage: React.FC = () => {
  const [videos, setVideos] = useState<VideoDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingVideo, setAddingVideo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalVideos, setTotalVideos] = useState<number>(0);
  const [dbMismatch, setDbMismatch] = useState<boolean>(false);

  useEffect(() => {
    fetchVideos();
    fetchTotalVideos();
  }, []);

  const fetchTotalVideos = async () => {
    try {
      const count = await getVideosCount();
      setTotalVideos(count);
      console.log('数据库中的视频总数:', count);
    } catch (error) {
      console.error('获取视频总数失败:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      console.log('开始获取视频数据...');
      setLoading(true);
      setError(null);
      
      // 使用新的函数获取数据
      const data = await getVideoDataForHome();
      console.log('处理后的视频数据:', data);
      
      if (data && data.length > 0) {
        // 检查是否是模拟数据
        const isMockData = data[0].id.startsWith('mock-');
        if (isMockData) {
          console.log('使用模拟数据');
          message.warning('后端服务不可用，显示模拟数据');
        }
        
        // 检查缩略图
        data.forEach((video, index) => {
          console.log(`视频 ${index + 1}:`, video);
          console.log(`视频 ${index + 1} 缩略图:`, video.thumbnail);
        });
        
        setVideos(data);
        console.log(`成功获取到 ${data.length} 个视频`);
        
        // 检查数据库中的视频数量是否与获取到的视频数量一致
        fetchTotalVideos().then(() => {
          if (totalVideos > 0 && totalVideos !== data.length) {
            setDbMismatch(true);
            console.warn(`数据库中有 ${totalVideos} 个视频，但只显示了 ${data.length} 个`);
          } else {
            setDbMismatch(false);
          }
        });
      } else {
        console.log('没有获取到视频数据');
        setError('没有找到视频数据');
      }
    } catch (error) {
      console.error('获取视频错误:', error);
      setError(error instanceof Error ? error.message : '未知错误');
      message.error('获取视频列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, hash_name: string) => {
    try {
      // 先乐观更新UI
      setVideos(videos.filter(video => video.id !== id));
      
      // 调用删除API
      const success = await deleteVideo(hash_name);
      
      if (success) {
        message.success('视频已删除');
      } else {
        // 如果删除失败，重新获取视频列表
        const data = await getVideoDataForHome();
        setVideos(data);
        message.error('删除失败');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      message.error('删除视频时发生错误');
      // 重新获取视频列表
      const data = await getVideoDataForHome();
      setVideos(data);
    }
  };

  const handleAddVideo = async (url: string) => {
    if (!url.trim()) {
      message.warning('请输入视频链接');
      return;
    }

    setAddingVideo(true);
    try {
      const newVideo = await addVideo(url);
      if (newVideo) {
        setVideos([newVideo, ...videos]);
        message.success('视频添加成功');
      } else {
        message.error('添加视频失败，请检查链接');
      }
    } catch (error) {
      console.error('添加视频错误:', error);
      message.error('添加视频时发生错误');
    } finally {
      setAddingVideo(false);
    }
  };

  const renderVideoCards = () => {
    if (videos.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Alert
            message="暂无视频"
            description="添加视频链接开始使用"
            type="info"
            showIcon
          />
        </div>
      );
    }

    return (
      <Row gutter={[24, 24]}>
        {videos.map(video => {
          console.log(`渲染视频卡 ${video.id}:`, video);
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={video.id}>
              <VideoCard
                title={video.title}
                description={video.description}
                time={video.time}
                timestamp={video.timestamp}
                source={video.source}
                thumbnail={video.thumbnail}
                hash_name={video.hash_name}
                onDelete={() => handleDelete(video.id, video.hash_name)}
              />
            </Col>
          );
        })}
      </Row>
    );
  };

  return (
    <div className={styles.homePage}>
      <div className={styles.welcomeContainer}>
        <Title level={2} className={styles.welcomeTitle}>
          欢迎使用 YanghooAI 视频App
        </Title>
        
        <div style={{ display: 'flex', maxWidth: 600, margin: '20px 0' }}>
          <Search
            placeholder="输入 YouTube 或 Podcast 链接"
            enterButton="添加视频"
            size="large"
            loading={addingVideo}
            onSearch={handleAddVideo}
            style={{ flex: 1 }}
          />
          <Button 
            icon={<ReloadOutlined />} 
            size="large"
            onClick={fetchVideos}
            loading={loading}
            style={{ marginLeft: 8 }}
          />
        </div>
        
        {/* 显示视频数量信息 */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ marginRight: 16 }}>
            当前显示: <Badge count={videos.length} style={{ backgroundColor: '#52c41a' }} />
          </span>
          
          {totalVideos > 0 && (
            <span style={{ marginRight: 16 }}>
              数据库总数: <Badge count={totalVideos} style={{ backgroundColor: '#1890ff' }} />
            </span>
          )}
          
          {dbMismatch && (
            <Tooltip title={`数据库中有 ${totalVideos} 个视频，但只显示了 ${videos.length} 个。可能是分页限制或数据过滤导致的。`}>
              <Alert
                message={`数据不匹配: 显示 ${videos.length}/${totalVideos}`}
                type="warning"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ display: 'inline-block', marginTop: 8 }}
              />
            </Tooltip>
          )}
        </div>
      </div>
      
      <div className={styles.videoGrid}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <Alert
              message="获取数据出错"
              description={error}
              type="error"
              showIcon
            />
          </div>
        ) : renderVideoCards()}
      </div>
    </div>
  );
};

export default HomePage; 