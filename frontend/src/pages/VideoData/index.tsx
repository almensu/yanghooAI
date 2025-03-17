import React, { useEffect, useState } from 'react';
import { Table, Typography, Card, Spin, Alert, Button, Space, Input, Popconfirm, message, Tooltip, Modal, Image, Tag } from 'antd';
import type { ColumnType } from 'antd/es/table';

import { ReloadOutlined, DatabaseOutlined, SearchOutlined, EyeOutlined, DeleteOutlined, FileImageOutlined, FileTextOutlined } from '@ant-design/icons';
import { ReloadOutlined as ReloadOutlinedIcon } from '@ant-design/icons';
import { getVideoData, deleteVideo, getOriginalTranscript, checkDatabaseConsistency } from '@/services/video';
import styles from './index.less';

const { Title } = Typography;
const { Search } = Input;

interface Window {
  mockVideoData?: VideoData[];
}

interface VideoData {
  // 数据库基本字段
  id: number;
  title: string;
  url: string;
  hash_name: string;
  folder_hash_name_path: string;
  created_at: string;
  status: string;
  last_synced_at?: string;

  // 文件路径字段（与本地文件夹结构对应）
  file_path: string;                         // /data/{hash}/original/video.mp4
  pic_thumb_path: string;                    // /data/{hash}/original/thumbnail.jpg
  wav_path: string;                          // /data/{hash}/original/audio.wav
  subtitle_en_json_path: string;             // /data/{hash}/subtitles/en.json
  subtitle_zh_cn_json_path: string;          // /data/{hash}/subtitles/zh.json
  subtitle_en_ass_path: string;              // /data/{hash}/subtitles/en.ass
  subtitle_zh_cn_ass_path: string;           // /data/{hash}/subtitles/bilingual.ass
  subtitle_en_md_path: string;               // /data/{hash}/docs/en.md
  subtitle_zh_cn_md_path: string;            // /data/{hash}/docs/zh.md
  subtitle_en_with_words_json_path: string;  // /data/{hash}/subtitles/whisperx.json

  // 前端展示用的文件结构（基于本地文件夹组织）
  files?: {
    video: string;      // original/video.mp4
    thumbnail: string;  // original/thumbnail.jpg
    wav: string;        // original/audio.wav
    subtitles: {
      en_json: string;          // subtitles/en.json
      zh_json: string;          // subtitles/zh.json
      en_ass: string;           // subtitles/en.ass
      zh_ass: string;           // subtitles/bilingual.ass
      en_md: string;            // docs/en.md
      zh_md: string;            // docs/zh.md
      en_with_words: string;    // subtitles/whisperx.json
    };
  };
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
  
  return false;
};

// 修改 getFileUrl 函数，确保正确处理文件路径
const getFileUrl = (hash_name: string, type?: string): string => {
  if (!hash_name) return '';
  
  // 使用一致的API基础URL
  const baseUrl = '/api';
  
  // 添加调试日志
  console.log(`构建文件URL: hash_name=${hash_name}, type=${type}`);
  
  let url = '';
  switch (type) {
    case 'en_json':
      url = `${baseUrl}/video/${hash_name}/subtitle/en.json`;
      break;
    case 'zh_json':
      url = `${baseUrl}/video/${hash_name}/subtitle/zh.json`;
      break;
    case 'bilingual_ass':
      url = `${baseUrl}/video/${hash_name}/subtitle/bilingual.ass`;
      break;
    case 'whisperx':
      url = `${baseUrl}/video/${hash_name}/subtitle/whisperx.json`;
      break;
    case 'wav':
      url = `${baseUrl}/video/${hash_name}/audio`;
      break;
    case 'thumbnail':
      // 尝试直接使用hash_name构建缩略图URL
      url = `${baseUrl}/video/${hash_name}/thumbnail`;
      break;
    default:
      url = `${baseUrl}/video/${hash_name}`;
  }
  
  console.log(`生成的URL: ${url}`);
  return url;
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
      // 获取视频数据
      console.log('获取视频数据...');
      const response = await getVideoData();
      console.log('获取到的视频数据类型:', typeof response);
      console.log('获取到的视频数据:', response);
      
      // 更健壮的数据验证
      if (!response) {
        throw new Error('未获取到数据');
      }
      
      // 处理可能是字符串的情况
      let data: any = response;
      if (typeof response === 'string') {
        try {
          data = JSON.parse(response);
          console.log('解析字符串后的数据:', data);
        } catch (e) {
          console.error('解析返回的字符串失败:', e);
          throw new Error('返回的数据格式不正确: 无法解析JSON字符串');
        }
      }
      
      // 确保 data 是数组
      let validData: VideoData[] = [];
      
      if (Array.isArray(data)) {
        validData = data;
        console.log('数据是数组格式');
      } else if (data && typeof data === 'object') {
        console.log('数据是对象格式，尝试提取数组');
        // 尝试从对象中提取数组
        if (Array.isArray(data.data)) {
          validData = data.data;
          console.log('从data字段提取数组成功');
        } else if (Array.isArray(data.videos)) {
          validData = data.videos;
          console.log('从videos字段提取数组成功');
        } else if (Array.isArray(data.items)) {
          validData = data.items;
          console.log('从items字段提取数组成功');
        } else if (Array.isArray(data.results)) {
          validData = data.results;
          console.log('从results字段提取数组成功');
        } else {
          // 如果是单个对象，尝试转换为数组
          if (data.id !== undefined && data.title !== undefined) {
            validData = [data as VideoData];
            console.log('将单个对象转换为数组');
          } else {
            console.error('无法从对象中提取数组:', data);
            throw new Error('返回的数据格式不正确: 无法提取视频数组');
          }
        }
      } else {
        console.error('数据格式不是对象也不是数组:', typeof data);
        throw new Error(`返回的数据格式不正确: ${typeof data}`);
      }
      
      // 确保每个项目都有必要的字段
      const processedData = validData.map((item, index) => {
        console.log(`处理视频数据项 ${index}:`, item);
        
        return {
          id: item.id || index + 1,
          title: item.title || `未命名视频 ${index + 1}`,
          url: item.url || '',
          hash_name: item.hash_name || `video-${index + 1}`,
          folder_hash_name_path: item.folder_hash_name_path || '',
          created_at: item.created_at || new Date().toISOString(),
          status: item.status || 'pending',
          file_path: item.file_path || '',
          pic_thumb_path: item.pic_thumb_path || '',
          wav_path: item.wav_path || '',
          subtitle_en_json_path: item.subtitle_en_json_path || '',
          subtitle_zh_cn_json_path: item.subtitle_zh_cn_json_path || '',
          subtitle_en_ass_path: item.subtitle_en_ass_path || '',
          subtitle_zh_cn_ass_path: item.subtitle_zh_cn_ass_path || '',
          subtitle_en_md_path: item.subtitle_en_md_path || '',
          subtitle_zh_cn_md_path: item.subtitle_zh_cn_md_path || '',
          subtitle_en_with_words_json_path: item.subtitle_en_with_words_json_path || '',
          files: item.files || {
            video: '',
            thumbnail: '',
            wav: '',
            subtitles: {
              en_json: '',
              zh_json: '',
              en_ass: '',
              zh_ass: '',
              en_md: '',
              zh_md: '',
              en_with_words: ''
            }
          }
        };
      });
      
      console.log('处理后的数据:', processedData);
      setVideoData(processedData);
      setFilteredData(processedData);
      
    } catch (error) {
      console.error('获取视频数据失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
      
      // 出错时使用模拟数据
      const mockData: VideoData[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `[模拟] 示例视频 ${i + 1}`,
        url: 'https://example.com/mock-video',
        hash_name: `mock-${i + 1}`,
        folder_hash_name_path: '',
        created_at: new Date().toISOString(),
        status: 'pending',
        file_path: '',
        pic_thumb_path: '',
        wav_path: '',
        subtitle_en_json_path: '',
        subtitle_zh_cn_json_path: '',
        subtitle_en_ass_path: '',
        subtitle_zh_cn_ass_path: '',
        subtitle_en_md_path: '',
        subtitle_zh_cn_md_path: '',
        subtitle_en_with_words_json_path: '',
        files: {
          video: '',
          thumbnail: '',
          wav: '',
          subtitles: {
            en_json: '',
            zh_json: '',
            en_ass: '',
            zh_ass: '',
            en_md: '',
            zh_md: '',
            en_with_words: ''
          }
        }
      }));
      
      setVideoData(mockData);
      setFilteredData(mockData);
      message.warning('后端服务不可用，显示模拟数据');
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

  const columns: ColumnType<VideoData>[] = [
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
      render: (_: any, record: VideoData) => {
        // 尝试多种可能的缩略图路径
        let thumbnailUrl = '';
        
        // 1. 首先尝试使用pic_thumb_path
        if (record.pic_thumb_path) {
          if (record.pic_thumb_path.startsWith('http')) {
            thumbnailUrl = record.pic_thumb_path;
          } else if (record.pic_thumb_path.startsWith('/')) {
            thumbnailUrl = `/api${record.pic_thumb_path}`;
          } else {
            thumbnailUrl = `/api/${record.pic_thumb_path}`;
          }
        }
        // 2. 然后尝试使用hash_name
        else if (record.hash_name) {
          thumbnailUrl = `/api/video/${record.hash_name}/thumbnail`;
        }
        
        console.log(`记录ID ${record.id} 的缩略图URL: ${thumbnailUrl}`);
        
        return (
          <div>
            <div style={{ width: 80, height: 45, overflow: 'hidden', borderRadius: 4, marginBottom: 4 }}>
              <img 
                src={thumbnailUrl} 
                alt={record.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => handlePreviewImage(thumbnailUrl, record.title)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  console.error(`缩略图加载失败: ${thumbnailUrl}`);
                  
                  // 尝试备用路径
                  if (!thumbnailUrl.includes('/thumbnail') && record.hash_name) {
                    const backupUrl = `/api/video/${record.hash_name}/thumbnail`;
                    console.log(`尝试备用URL: ${backupUrl}`);
                    target.src = backupUrl;
                  } else {
                    target.src = '/static/assets/default-thumbnail.svg';
                  }
                }}
              />
            </div>
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
      title: '视频链接',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '处理中' },
          completed: { color: 'green', text: '已完成' },
          error: { color: 'red', text: '错误' },
        };
        const status = statusMap[text] || { color: 'default', text: text || '未知' };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '字幕文件',
      key: 'subtitles',
      width: 400,
      render: (_: any, record: VideoData) => {
        const getFileLink = (path: string | null | undefined, label: string, type?: string) => {
          if (!path) return null;
          return (
            <Tooltip title={`下载${label}`}>
              <a href={getFileUrl(path, type)} target="_blank" rel="noopener noreferrer">
                <Button type="link" icon={<FileTextOutlined />} size="small">
                  {label}
                </Button>
              </a>
            </Tooltip>
          );
        };

        return (
          <Space wrap>
            {getFileLink(record.hash_name, '英文JSON', 'en_json')}
            {getFileLink(record.hash_name, '中文JSON', 'zh_json')}
            {getFileLink(record.hash_name, '双语字幕', 'bilingual_ass')}
            {getFileLink(record.hash_name, '单词时间戳', 'whisperx')}
          </Space>
        );
      },
    },
    {
      title: '音频',
      key: 'audio',
      width: 100,
      render: (_: any, record: VideoData) => {
        if (!record.hash_name) return '-';
        return (
          <Tooltip title="下载音频文件">
            <a href={getFileUrl(record.hash_name, 'wav')} target="_blank" rel="noopener noreferrer">
              <Button type="link" icon={<FileTextOutlined />} size="small">
                WAV
              </Button>
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '最后同步',
      dataIndex: 'last_synced_at',
      key: 'last_synced_at',
      width: 180,
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: VideoData) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.hash_name)}
            />
          </Tooltip>
          <Tooltip title="查看原始转写">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => handleViewOriginalTranscript(record.hash_name)}
              disabled={!hasOriginalTranscript(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个视频吗？"
            onConfirm={() => handleDelete(record.hash_name)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
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
          <Button
            onClick={async () => {
              try {
                const result = await checkDatabaseConsistency();
                if (result.is_consistent) {
                  message.success('数据库与本地文件一致');
                } else {
                  Modal.warning({
                    title: '数据库与本地文件不一致',
                    content: (
                      <div>
                        <p>发现以下不一致:</p>
                        <p>数据库中有 {result.db_videos_count} 条记录</p>
                        <p>本地文件夹有 {result.hash_folders_count} 个</p>
                        <p>数据库中有但本地没有: {result.inconsistencies.db_entries_without_folder.length} 个</p>
                        <p>本地有但数据库中没有: {result.inconsistencies.folders_not_in_db.length} 个</p>
                      </div>
                    ),
                  });
                }
              } catch (error) {
                message.error('检查数据库一致性失败');
              }
            }}
            icon={<DatabaseOutlined />}
          >
            检查数据库一致性
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
            dataSource={Array.isArray(filteredData) ? filteredData : []}
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