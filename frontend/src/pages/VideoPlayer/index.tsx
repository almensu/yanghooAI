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
  Skeleton,
  Layout,
  Row,
  Col,
  Input,
  Tag,
  Affix,
  Breadcrumb,
  Collapse,
  Menu,
  Dropdown
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  SearchOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  SettingOutlined,
  SoundOutlined,
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { getVideoByHash } from '@/services/video';
import styles from './index.less';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Header, Content, Sider } = Layout;
const { Search } = Input;
const { Panel } = Collapse;

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
  const [filteredSubtitles, setFilteredSubtitles] = useState<SubtitleItem[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<number | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('subtitles');
  const [searchText, setSearchText] = useState<string>('');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const subtitlesListRef = useRef<HTMLDivElement>(null);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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
                setFilteredSubtitles(mergedSubtitles);
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
          setFilteredSubtitles(enSubtitles);
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

  // 返回上一页
  const handleGoBack = () => {
    history.goBack();
  };

  // 搜索字幕
  const handleSearchSubtitles = (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredSubtitles(subtitles);
      return;
    }
    
    const filtered = subtitles.filter(subtitle => {
      const searchValue = value.toLowerCase();
      return (
        (subtitle.text && subtitle.text.toLowerCase().includes(searchValue)) ||
        (subtitle.text_zh && subtitle.text_zh.toLowerCase().includes(searchValue))
      );
    });
    
    setFilteredSubtitles(filtered);
  };

  // 切换侧边栏折叠状态
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // 渲染字幕列表
  const renderSubtitlesList = () => {
    if (filteredSubtitles.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={searchText ? "没有找到匹配的字幕" : "暂无字幕"}
        />
      );
    }

    return (
      <List
        dataSource={filteredSubtitles}
        renderItem={(subtitle, index) => (
          <List.Item 
            key={subtitle.id}
            id={`subtitle-${subtitle.id}`}
            className={currentSubtitle === subtitle.id ? styles.activeSubtitle : ''}
            onClick={() => handleSubtitleClick(subtitle)}
          >
            <div className={styles.subtitleItem}>
              <div className={styles.subtitleHeader}>
                <Tag color="blue">{formatTime(subtitle.start)}</Tag>
                <Text type="secondary">-</Text>
                <Tag color="blue">{formatTime(subtitle.end)}</Tag>
              </div>
              <div className={styles.subtitleContent}>
                <Paragraph className={styles.subtitleTextEn}>
                  {subtitle.text}
                </Paragraph>
                {subtitle.text_zh && (
                  <Paragraph className={styles.subtitleTextZh}>
                    {subtitle.text_zh}
                  </Paragraph>
                )}
              </div>
            </div>
          </List.Item>
        )}
      />
    );
  };

  // 渲染移动端布局
  const renderMobileLayout = () => {
    return (
      <Layout className={styles.mobileLayout}>
        <Content className={styles.mobileContent}>
          {/* 视频播放器 */}
          <Card className={styles.videoCard} bordered={false}>
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
          </Card>
          
          {/* 标签页切换字幕和文档 */}
          <Card className={styles.tabsCard} bordered={false}>
            <Tabs 
              defaultActiveKey="subtitles" 
              onChange={setActiveTab}
              tabBarExtraContent={
                activeTab === 'subtitles' ? (
                  <Search
                    placeholder="搜索字幕"
                    allowClear
                    size="small"
                    onSearch={handleSearchSubtitles}
                    onChange={(e) => handleSearchSubtitles(e.target.value)}
                    style={{ width: 150 }}
                  />
                ) : null
              }
            >
              <TabPane 
                tab={
                  <span>
                    <MessageOutlined />
                    字幕
                  </span>
                } 
                key="subtitles"
              >
                <div className={styles.subtitlesList} ref={subtitlesListRef}>
                  {renderSubtitlesList()}
                </div>
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <FileTextOutlined />
                    文档
                  </span>
                } 
                key="document"
              >
                {markdownContent ? (
                  <div className={styles.markdownContent}>
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无文档内容"
                  />
                )}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <InfoCircleOutlined />
                    信息
                  </span>
                } 
                key="info"
              >
                <Descriptions 
                  title="视频信息" 
                  bordered 
                  size="small"
                  column={1}
                >
                  <Descriptions.Item label="标题">{videoData?.title || '未知'}</Descriptions.Item>
                  <Descriptions.Item label="来源">{videoData?.url || '未知'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {videoData?.created_at ? new Date(videoData.created_at).toLocaleString('zh-CN') : '未知'}
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>
            </Tabs>
          </Card>
        </Content>
      </Layout>
    );
  };

  // 渲染桌面端布局
  const renderDesktopLayout = () => {
    return (
      <Layout className={styles.desktopLayout}>
        <Content className={styles.mainContent}>
          <Row gutter={16}>
            {/* 左侧：视频和文档 */}
            <Col span={collapsed ? 22 : 16}>
              <Card className={styles.videoCard} bordered={false}>
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
              </Card>
              
              <Card 
                className={styles.documentCard} 
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>文档内容</span>
                  </Space>
                }
                bordered={false}
                style={{ marginTop: 16 }}
              >
                {markdownContent ? (
                  <div className={styles.markdownContent}>
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无文档内容"
                  />
                )}
              </Card>
            </Col>
            
            {/* 右侧：字幕 */}
            {!collapsed && (
              <Col span={8}>
                <Card 
                  className={styles.subtitlesCard} 
                  title={
                    <Space>
                      <MessageOutlined />
                      <span>字幕</span>
                      <Text type="secondary">({filteredSubtitles.length})</Text>
                    </Space>
                  }
                  extra={
                    <Search
                      placeholder="搜索字幕"
                      allowClear
                      size="small"
                      onSearch={handleSearchSubtitles}
                      onChange={(e) => handleSearchSubtitles(e.target.value)}
                      style={{ width: 150 }}
                    />
                  }
                  bordered={false}
                >
                  <div className={styles.subtitlesList} ref={subtitlesListRef}>
                    {renderSubtitlesList()}
                  </div>
                </Card>
              </Col>
            )}
          </Row>
        </Content>
        
        {/* 折叠按钮 */}
        <Affix className={styles.collapseButton} offsetTop={100}>
          <Button 
            type="primary" 
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            shape="circle"
          />
        </Affix>
      </Layout>
    );
  };

  // 渲染页面
  return (
    <Layout className={styles.videoPlayerPage}>
      <Card className={styles.pageHeader}>
        <Row justify="space-between" align="middle">
          <Col>
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
          </Col>
          <Col>
            <Space>
              {videoData?.files?.subtitles?.en_json && (
                <Tooltip title="下载英文字幕">
                  <Button 
                    icon={<DownloadOutlined />} 
                    href={getFileUrl(videoData.files.subtitles.en_json)}
                    target="_blank"
                  >
                    EN
                  </Button>
                </Tooltip>
              )}
              {videoData?.files?.subtitles?.zh_json && (
                <Tooltip title="下载中文字幕">
                  <Button 
                    icon={<DownloadOutlined />} 
                    href={getFileUrl(videoData.files.subtitles.zh_json)}
                    target="_blank"
                  >
                    中文
                  </Button>
                </Tooltip>
              )}
            </Space>
          </Col>
        </Row>
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
        isMobile ? renderMobileLayout() : renderDesktopLayout()
      )}
    </Layout>
  );
};

// 添加缺少的Descriptions组件
const Descriptions = ({ title, bordered, size, column, children }: any) => {
  return (
    <div className={styles.descriptions}>
      <h3>{title}</h3>
      <div className={styles.descriptionsContent}>
        {children}
      </div>
    </div>
  );
};

Descriptions.Item = ({ label, children }: any) => {
  return (
    <div className={styles.descriptionsItem}>
      <div className={styles.descriptionsLabel}>{label}</div>
      <div className={styles.descriptionsValue}>{children}</div>
    </div>
  );
};

export default VideoPlayerPage; 