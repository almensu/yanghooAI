# 视频卡片删除功能实现记录

## 日期
2023-11-15

## 功能描述
在视频卡片的右上角添加一个垃圾桶图标按钮，与左上角的来源标签在同一水平线上。用户点击该按钮时，可以删除对应的视频卡片。

## 实现细节

### 1. 修改 VideoCard 组件 (src/components/VideoCard/index.tsx)

添加了删除图标和相关功能：

```tsx
import React from 'react';
import { Card, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons'; // 导入删除图标
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

interface VideoCardProps {
  thumbnail?: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  source: string;
  onDelete?: () => void; // 添加删除回调函数属性
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
  return (
    <Card className={styles.videoCard} bordered={false}>
      <div className={styles.thumbnailContainer}>
        <div className={styles.thumbnailOverlay}>
          <div className={styles.sourceButton}>
            <span>来自</span>
            <span>{source}</span>
          </div>
        </div>
        {/* 添加删除按钮 */}
        <div className={styles.deleteButton} onClick={onDelete}>
          <DeleteOutlined />
        </div>
        <div className={styles.thumbnail} style={{ backgroundColor: '#D9D9D9' }} />
      </div>
      {/* 其余代码保持不变 */}
    </Card>
  );
};

export default VideoCard;
```

### 2. 添加删除按钮样式 (src/components/VideoCard/index.less)

为删除按钮添加样式，使其位于右上角并与左侧的来源标签在同一水平线上：

```less
.deleteButton {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 5px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
    color: #ff4d4f; // 鼠标悬停时变为红色
  }
}
```

### 3. 更新首页组件 (src/pages/Home/index.tsx)

在首页组件中添加删除处理函数，并将其传递给VideoCard组件：

```tsx
import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Alert, Spin, message } from 'antd'; // 导入message组件
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

  // 添加删除处理函数
  const handleDelete = (id: string) => {
    setVideos(videos.filter(video => video.id !== id));
    message.success('视频已删除');
  };

  return (
    <div className={styles.homePage}>
      {/* 其他代码保持不变 */}
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
              onDelete={() => handleDelete(video.id)} // 添加删除回调
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
```

## 功能效果

1. 视频卡片右上角显示一个垃圾桶图标按钮
2. 按钮与左上角的来源标签在同一水平线上
3. 鼠标悬停在按钮上时，按钮背景变深，图标变为红色
4. 点击按钮时，对应的视频卡片会从列表中删除
5. 删除成功后，页面顶部会显示"视频已删除"的提示信息

## Git提交记录

```bash
# 添加修改的文件到暂存区
git add src/components/VideoCard/index.less src/components/VideoCard/index.tsx src/pages/Home/index.tsx

# 提交更改
git commit -m "添加视频卡片右上角删除按钮功能"

# 推送到远程仓库
git push origin main
```

提交信息: "添加视频卡片右上角删除按钮功能"

提交内容:
- 修改了3个文件
- 添加了35行代码
- 删除了1行代码

## 相关文件

- `src/components/VideoCard/index.tsx` - 添加删除按钮和回调函数
- `src/components/VideoCard/index.less` - 添加删除按钮样式
- `src/pages/Home/index.tsx` - 添加删除处理逻辑 