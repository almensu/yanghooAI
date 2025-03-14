import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from 'umi';
import { 
  Card, 
  Typography, 
  Spin, 
  Alert, 
  Button, 
  Space, 
  Divider, 
  Tabs, 
  Empty, 
  List, 
  Tooltip, 
  Skeleton
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  ColumnWidthOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { getVideoByHash } from '@/services/video';
import styles from './index.less';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 字幕项接口
interface SubtitleItem {
  id: number;
  start: number;
  end: number;
  text: string;
  text_zh?: string;
}

// 处理文件路径，确保能正确访问
const getFileUrl = (path: string | undefined): string => {
  if (!path) return '';
  
  let result = path;
  
  if (path.startsWith('/file/')) {
    result = `/api${path}`;
  } else if (path.startsWith('data/')) {
    result = `/api/file/${path}`;
  } else if (!path.startsWith('http') && !path.startsWith('/')) {
    result = `/api/file/${path}`;
  }
  
  return result;
};

// 视频播放器页面组件
const VideoPlayerPage: React.FC = () => {
  const { hash_name } = useParams<{ hash_name: string }>();
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<number | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(65);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const subtitlesListRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // 获取视频数据
  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVideoByHash(hash_name);
        if (!data) {
          throw new Error('视频不存在或已被删除');
        }
        
        console.log('获取到的视频数据:', data);
        setVideoData(data);
        
        // 加载字幕
        await loadSubtitles(data);
        
        // 加载文档
        await loadDocument(data);
      } catch (err) {
        console.error('获取视频数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoData();
  }, [hash_name]);

  // 加载字幕
  const loadSubtitles = async (data: any) => {
    try {
      // 优先加载英文字幕
      if (data.files?.subtitles?.en_json) {
        const response = await fetch(getFileUrl(data.files.subtitles.en_json));
        const subtitleData = await response.json();
        
        if (subtitleData && subtitleData.segments) {
          // 如果有中文字幕，加载中文字幕并合并
          if (data.files?.subtitles?.zh_json) {
            try {
              const zhResponse = await fetch(getFileUrl(data.files.subtitles.zh_json));
              const zhSubtitleData = await zhResponse.json();
              
              if (zhSubtitleData && zhSubtitleData.segments) {
                // 合并英文和中文字幕
                const mergedSubtitles = subtitleData.segments.map((segment: any, index: number) => ({
                  id: index,
                  start: segment.start,
                  end: segment.end,
                  text: segment.text,
                  text_zh: zhSubtitleData.segments[index]?.text || ''
                }));
                
                setSubtitles(mergedSubtitles);
                return;
              }
            } catch (zhErr) {
              console.error('加载中文字幕失败:', zhErr);
            }
          }
          
          // 如果没有中文字幕或加载失败，只使用英文字幕
          const enSubtitles = subtitleData.segments.map((segment: any, index: number) => ({
            id: index,
            start: segment.start,
            end: segment.end,
            text: segment.text
          }));
          
          setSubtitles(enSubtitles);
        }
      }
    } catch (err) {
      console.error('加载字幕失败:', err);
    }
  };

  // 加载文档
  const loadDocument = async (data: any) => {
    try {
      // 优先加载中文文档
      if (data.files?.subtitles?.zh_md) {
        const response = await fetch(getFileUrl(data.files.subtitles.zh_md));
        const content = await response.text();
        setMarkdownContent(content);
      } else if (data.files?.subtitles?.en_md) {
        // 如果没有中文文档，加载英文文档
        const response = await fetch(getFileUrl(data.files.subtitles.en_md));
        const content = await response.text();
        setMarkdownContent(content);
      }
    } catch (err) {
      console.error('加载文档失败:', err);
    }
  };

  // 处理视频时间更新
  const handleTimeUpdate = () => {
    if (!videoRef.current || subtitles.length === 0) return;
    
    const currentTime = videoRef.current.currentTime;
    
    // 查找当前时间对应的字幕
    const currentIndex = subtitles.findIndex(
      subtitle => currentTime >= subtitle.start && currentTime <= subtitle.end
    );
    
    if (currentIndex !== -1 && currentIndex !== currentSubtitle) {
      setCurrentSubtitle(currentIndex);
      
      // 滚动到当前字幕
      if (subtitlesListRef.current) {
        const subtitleElement = document.getElementById(`subtitle-${currentIndex}`);
        if (subtitleElement) {
          subtitlesListRef.current.scrollTop = subtitleElement.offsetTop - 100;
        }
      }
    } else if (currentIndex === -1 && currentSubtitle !== null) {
      setCurrentSubtitle(null);
    }
  };

  // 点击字幕跳转到对应时间
  const handleSubtitleClick = (subtitle: SubtitleItem) => {
    if (videoRef.current) {
      videoRef.current.currentTime = subtitle.start;
      videoRef.current.play();
    }
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 处理面板调整大小
  const handleResizeStart = (e: React.MouseEvent) => {
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    const containerWidth = document.querySelector(`.${styles.contentContainer}`)?.clientWidth || 1000;
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.min(Math.max(30, startWidthRef.current + (deltaX / containerWidth) * 100), 80);
    
    setLeftPanelWidth(newWidth);
  };

  const handleResizeEnd = () => {
    resizingRef.current = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // 返回上一页
  const handleGoBack = () => {
    history.goBack();
  };

  // 渲染页面
  return (
    <div className={styles.videoPlayerPage}>
      <Card className={styles.pageHeader}>
        <Space align="center">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleGoBack}
          />
          <Title level={3} style={{ margin: 0 }}>
            {loading ? '加载中...' : videoData?.title || '未知视频'}
          </Title>
        </Space>
      </Card>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>加载视频数据中...</p>
        </div>
      ) : error ? (
        <Alert
          message="获取视频失败"
          description={error}
          type="error"
          showIcon
        />
      ) : (
        <div className={styles.contentContainer}>
          {/* 左侧面板：视频播放器和文档 */}
          <div 
            className={styles.leftPanel} 
            style={{ width: `${leftPanelWidth}%` }}
          >
            {/* 视频播放器 */}
            <div className={styles.videoContainer}>
              {videoData?.files?.video ? (
                <video
                  ref={videoRef}
                  className={styles.videoPlayer}
                  src={getFileUrl(videoData.files.video)}
                  controls
                  autoPlay
                  onTimeUpdate={handleTimeUpdate}
                />
              ) : (
                <div className={styles.noVideo}>
                  <PlayCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                  <p>视频文件不可用</p>
                </div>
              )}
            </div>

            {/* 文档内容 */}
            <div className={styles.documentContainer}>
              <Divider orientation="left">
                <Space>
                  <FileTextOutlined />
                  <span>文档内容</span>
                </Space>
              </Divider>
              
              {markdownContent ? (
                <div className={styles.markdownContent}>
                  <ReactMarkdown>{markdownContent}</ReactMarkdown>
                </div>
              ) : (
                <div className={styles.noDocument}>
                  <FileTextOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                  <p>暂无文档内容</p>
                </div>
              )}
            </div>
            
            {/* 调整大小的手柄 */}
            <div 
              className={styles.resizableHandle}
              onMouseDown={handleResizeStart}
            />
          </div>

          {/* 右侧面板：字幕 */}
          <div className={styles.rightPanel}>
            <div className={styles.subtitlesHeader}>
              <Space>
                <MessageOutlined />
                <span>字幕</span>
                <Text type="secondary">({subtitles.length})</Text>
              </Space>
            </div>
            
            {subtitles.length > 0 ? (
              <div className={styles.subtitlesList} ref={subtitlesListRef}>
                {subtitles.map((subtitle, index) => (
                  <div
                    key={subtitle.id}
                    id={`subtitle-${index}`}
                    className={`${styles.subtitleItem} ${currentSubtitle === index ? styles.active : ''}`}
                    onClick={() => handleSubtitleClick(subtitle)}
                  >
                    <div className={styles.timestamp}>
                      {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
                    </div>
                    <div className={styles.subtitleTextEn}>
                      {subtitle.text}
                    </div>
                    {subtitle.text_zh && (
                      <div className={styles.subtitleTextZh}>
                        {subtitle.text_zh}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noSubtitles}>
                <MessageOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                <p>暂无字幕</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerPage; 