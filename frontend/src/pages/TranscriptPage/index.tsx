import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Button, Space, Typography, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import TranscriptViewer from '@/components/TranscriptViewer';
import { getVideoByHash } from '@/services/video';
import styles from './index.less';

const { Title } = Typography;

const TranscriptPage: React.FC = () => {
  const { hashName } = useParams<{ hashName: string }>();
  const history = useHistory();
  const [videoTitle, setVideoTitle] = useState<string>('');
  
  useEffect(() => {
    const fetchVideoInfo = async () => {
      if (hashName) {
        try {
          const videoInfo = await getVideoByHash(hashName);
          if (videoInfo) {
            setVideoTitle(videoInfo.title || '未命名视频');
          }
        } catch (error) {
          console.error('获取视频信息失败:', error);
        }
      }
    };
    
    fetchVideoInfo();
  }, [hashName]);
  
  const handleBack = () => {
    history.goBack();
  };
  
  return (
    <PageContainer
      header={{
        title: (
          <Space>
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              style={{ marginLeft: -12 }}
            />
            <Title level={4} style={{ margin: 0 }}>
              {videoTitle} - 转写结果
            </Title>
          </Space>
        ),
        breadcrumb: (
          <Breadcrumb>
            <Breadcrumb.Item href="/">
              <HomeOutlined />
              <span>首页</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item href="/video-data">视频数据库</Breadcrumb.Item>
            <Breadcrumb.Item>转写结果</Breadcrumb.Item>
          </Breadcrumb>
        ),
      }}
    >
      <div className={styles.container}>
        <TranscriptViewer hashName={hashName} />
      </div>
    </PageContainer>
  );
};

export default TranscriptPage; 