import React, { useEffect, useState } from 'react';
import { Table, Typography, Card, Spin, Alert, Button, Space, Input, Popconfirm, message, Tooltip, Modal, Image } from 'antd';

import { ReloadOutlined, DatabaseOutlined, SearchOutlined, EyeOutlined, DeleteOutlined, FileImageOutlined, FileTextOutlined } from '@ant-design/icons';
import { getVideoData, deleteVideo, getOriginalTranscript } from '@/services/video';
import styles from './index.less';

const { Title } = Typography;
const { Search } = Input;

// 处理文件路径，确保能正确访问
const getFileUrl = (path: string | undefined): string => {
  if (!path) return '';
  
  // 记录原始路径
  console.log('处理文件路径:', path);
  
  let result = path;
  
  if (path.startsWith('/file/')) {
    result = `/api${path}`;
  } else if (path.startsWith('data/')) {
    result = `/api/file/${path}`;
  } else if (!path.startsWith('http') && !path.startsWith('/')) {
    result = `/api/file/${path}`;
  }
  
  console.log('处理后的路径:', result);
  return result;
};

interface VideoData {
  id: number;
  title: string;
  url: string;
  hash_name: string;
  created_at: string;
  file_path: string;
  subtitle_en_json_path?: string;
  subtitle_en_ass_path?: string;
  subtitle_zh_cn_json_path?: string;
  subtitle_zh_cn_ass_path?: string;
  folder_hash_name_path?: string;
  has_original_transcript?: boolean;
  files?: {
    subtitles?: {
      en_json?: string;
      zh_json?: string;
      en_ass?: string;
      zh_ass?: string;
      ass?: string;
      en_md?: string;
      zh_md?: string;
    };
  };
  [key: string]: any;
}

// 检查是否有原始转写文件
const hasOriginalTranscript = (record: VideoData): boolean => {
  // 检查新结构
  if (record.files?.subtitles?.en_json) {
    return true;
  }
  
  // 检查旧结构
  if (record.subtitle_en_json_path) {
    return true;
  }
  
  // 检查后端提供的标志
  if (record.has_original_transcript) {
    return true;
  }
  
  return false;
};

const VideoDataPage: React.FC = () => {
  const [videoData, setVideoData] = useState<VideoData[]>([]);
  const [filteredData, setFilteredData] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const fetchVideoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVideoData();
      console.log('获取到的视频数据:', data);
      setVideoData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('获取视频数据失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoData();
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredData(videoData);
      return;
    }

    const filtered = videoData.filter(item => {
      const searchValue = value.toLowerCase();
      return (
        (item.title && item.title.toLowerCase().includes(searchValue)) ||
        (item.url && item.url.toLowerCase().includes(searchValue)) ||
        (item.hash_name && item.hash_name.toLowerCase().includes(searchValue))
      );
    });
    setFilteredData(filtered);
  };

  // 处理删除
  const handleDelete = async (hash_name: string) => {
    try {
      const success = await deleteVideo(hash_name);
      if (success) {
        message.success('视频已成功删除');
        // 更新列表
        fetchVideoData();
      } else {
        message.error('删除视频失败');
      }
    } catch (error) {
      console.error('删除视频时出错:', error);
      message.error('删除视频时发生错误');
    }
  };

  // 查看详情
  const handleViewDetails = (hash_name: string) => {
    window.open(`/video/${hash_name}`, '_blank');
  };

  // 查看原始转写
  const handleViewOriginalTranscript = async (hash_name: string) => {
    try {
      // 跳转到转写页面
      window.open(`/transcript/${hash_name}`, '_blank');
    } catch (error) {
      console.error('查看原始转写失败:', error);
      message.error('查看原始转写失败');
    }
  };

  // 处理图片预览
  const handlePreviewImage = (url: string, title: string) => {
    setPreviewImage(url);
    setPreviewTitle(title);
  };

  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '缩略图',
      dataIndex: 'pic_thumb_path',
      key: 'pic_thumb_path',
      width: 120,
      render: (text: string, record: VideoData) => {
        // 使用专门的缩略图API
        if (record.hash_name) {
          // 尝试使用专门的API
          const thumbnailUrl = `/api/video/${record.hash_name}/thumbnail`;
          console.log('使用缩略图API:', thumbnailUrl);
          
          // 添加一个直接访问的按钮
          return (
            <div>
              <div style={{ width: 80, height: 45, overflow: 'hidden', borderRadius: 4, marginBottom: 4 }}>
                <img 
                  src={thumbnailUrl} 
                  alt={record.title} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => handlePreviewImage(thumbnailUrl, record.title || '视频缩略图')}
                  onError={(e) => {
                    // 图片加载失败时显示默认图片
                    console.error('缩略图加载失败:', thumbnailUrl);
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // 防止无限循环
                    target.src = '/static/assets/default-thumbnail.svg';
                  }}
                />
              </div>
              {record.folder_hash_name_path && (
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => {
                    // 尝试直接访问缩略图
                    const directPath = `/api/direct-file/${record.hash_name}/original/thumbnail.jpg`;
                    window.open(directPath, '_blank');
                  }}
                  style={{ padding: 0, fontSize: 12 }}
                >
                  直接访问
                </Button>
              )}
            </div>
          );
        }
        
        return (
          <div 
            style={{ 
              width: 80, 
              height: 45, 
              background: '#f0f0f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: 4,
              color: '#999',
              fontSize: 12
            }}
          >
            <FileImageOutlined style={{ fontSize: 16 }} />
          </div>
        );
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <a href={text} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Hash',
      dataIndex: 'hash_name',
      key: 'hash_name',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '文件路径',
      dataIndex: 'file_path',
      key: 'file_path',
      width: 120,
      ellipsis: true,
      render: (text: string) => {
        if (!text) return '-';
        
        // 构建文件URL
        const fileUrl = getFileUrl(text);
        
        return (
          <Tooltip title={text}>
            <Button 
              type="link" 
              size="small" 
              onClick={() => window.open(fileUrl, '_blank')}
              style={{ padding: 0 }}
            >
              查看文件
            </Button>
          </Tooltip>
        );
      }
    },
    {
      title: '字幕文件',
      key: 'subtitles',
      width: 200,
      render: (_: any, record: VideoData) => {
        // 检查files.subtitles结构
        const subtitles = record.files?.subtitles;
        
        if (!subtitles) {
          // 兼容旧结构
          const enSubtitle = record.subtitle_en_json_path || record.subtitle_en_ass_path;
          const zhSubtitle = record.subtitle_zh_cn_json_path || record.subtitle_zh_cn_ass_path;
          
          if (!enSubtitle && !zhSubtitle) return '-';
          
          return (
            <Space size="small" wrap>
              {record.subtitle_en_json_path && (
                <Tooltip title="WhisperX 原始转写">
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => window.open(getFileUrl(record.subtitle_en_json_path), '_blank')}
                    style={{ padding: 0, fontWeight: 'bold', color: '#1890ff' }}
                  >
                    WhisperX转写
                  </Button>
                </Tooltip>
              )}
              {enSubtitle && (
                <Tooltip title="英文字幕">
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => window.open(getFileUrl(enSubtitle), '_blank')}
                    style={{ padding: 0 }}
                  >
                    EN
                  </Button>
                </Tooltip>
              )}
              {zhSubtitle && (
                <Tooltip title="中文字幕">
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => window.open(getFileUrl(zhSubtitle), '_blank')}
                    style={{ padding: 0 }}
                  >
                    中文
                  </Button>
                </Tooltip>
              )}
            </Space>
          );
        }
        
        // 新结构 - 使用files.subtitles
        return (
          <Space size="small" wrap>
            {subtitles.en_json && (
              <Tooltip title="WhisperX 原始转写">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.en_json), '_blank')}
                  style={{ padding: 0, fontWeight: 'bold', color: '#1890ff' }}
                >
                  WhisperX转写
                </Button>
              </Tooltip>
            )}
            {subtitles.en_json && (
              <Tooltip title="英文JSON字幕">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.en_json), '_blank')}
                  style={{ padding: 0 }}
                >
                  EN-JSON
                </Button>
              </Tooltip>
            )}
            {subtitles.zh_json && (
              <Tooltip title="中文JSON字幕">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.zh_json), '_blank')}
                  style={{ padding: 0 }}
                >
                  中文-JSON
                </Button>
              </Tooltip>
            )}
            {subtitles.en_ass && (
              <Tooltip title="英文ASS字幕">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.en_ass), '_blank')}
                  style={{ padding: 0 }}
                >
                  EN-ASS
                </Button>
              </Tooltip>
            )}
            {subtitles.zh_ass && (
              <Tooltip title="中文ASS字幕">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.zh_ass), '_blank')}
                  style={{ padding: 0 }}
                >
                  中文-ASS
                </Button>
              </Tooltip>
            )}
            {subtitles.ass && (
              <Tooltip title="双语ASS字幕">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.ass), '_blank')}
                  style={{ padding: 0 }}
                >
                  双语-ASS
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      }
    },
    {
      title: '文档',
      key: 'docs',
      width: 150,
      render: (_: any, record: VideoData) => {
        // 检查files.subtitles结构中的文档
        const subtitles = record.files?.subtitles;
        
        if (!subtitles) {
          return '-';
        }
        
        return (
          <Space size="small" wrap>
            {subtitles.en_md && (
              <Tooltip title="英文文档">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.en_md), '_blank')}
                  style={{ padding: 0 }}
                >
                  EN-MD
                </Button>
              </Tooltip>
            )}
            {subtitles.zh_md && (
              <Tooltip title="中文文档">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(subtitles.zh_md), '_blank')}
                  style={{ padding: 0 }}
                >
                  中文-MD
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      }
    },
    {
      title: '原始转写',
      key: 'original_transcript',
      width: 100,
      render: (_: any, record: VideoData) => {
        if (!hasOriginalTranscript(record)) {
          return '-';
        }
        
        // 确定原始转写文件的路径
        let transcriptPath = '';
        if (record.files?.subtitles?.en_json) {
          transcriptPath = record.files.subtitles.en_json;
        } else if (record.subtitle_en_json_path) {
          transcriptPath = record.subtitle_en_json_path;
        }
        
        return (
          <Space size="small">
            {transcriptPath && (
              <Tooltip title="查看文件">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.open(getFileUrl(transcriptPath), '_blank')}
                  style={{ padding: 0 }}
                >
                  查看文件
                </Button>
              </Tooltip>
            )}
            <Tooltip title="API访问">
              <Button 
                type="link" 
                size="small" 
                onClick={() => handleViewOriginalTranscript(record.hash_name)}
                style={{ padding: 0 }}
              >
                API访问
              </Button>
            </Tooltip>
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: VideoData) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetails(record.hash_name)}
              size="small"
            />
          </Tooltip>
          {hasOriginalTranscript(record) && (
            <Tooltip title="查看原始转写">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                onClick={() => handleViewOriginalTranscript(record.hash_name)}
                size="small"
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定要删除这个视频吗？"
            onConfirm={() => handleDelete(record.hash_name)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.videoDataPage}>
      <Card className={styles.pageHeader}>
        <Space align="center">
          <DatabaseOutlined style={{ fontSize: 24 }} />
          <Title level={2} style={{ margin: 0 }}>
            视频数据库
          </Title>
        </Space>
        <Space>
          <Search
            placeholder="搜索标题、URL或Hash"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
          />
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchVideoData}
            loading={loading}
          >
            刷新数据
          </Button>
        </Space>
      </Card>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>加载数据中...</p>
        </div>
      ) : error ? (
        <Alert
          message="获取数据失败"
          description={error}
          type="error"
          showIcon
        />
      ) : (
        <Card className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              {searchText ? (
                <span>搜索 "{searchText}" 的结果: {filteredData.length} 条记录</span>
              ) : (
                <span>共 {videoData.length} 条记录</span>
              )}
            </div>
          </div>
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {/* 图片预览模态框 */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: !!previewImage,
          src: previewImage || '',
          onVisibleChange: (visible) => {
            if (!visible) handleClosePreview();
          },
          title: previewTitle
        }}
      />
    </div>
  );
};

export default VideoDataPage; 