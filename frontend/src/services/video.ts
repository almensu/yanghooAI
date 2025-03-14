// 导入axios进行API请求
import axios from 'axios';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// API基础URL
const API_BASE_URL = '/api';

// 检查后端服务是否可用
async function checkBackendStatus(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    console.error('后端服务检查失败:', error);
    return false;
  }
}

// 视频接口，根据后端数据库结构定义
export interface Video {
  id: number;
  title: string;
  url: string;
  hash_name: string;
  folder_hash_name_path: string;
  created_at: string;
  status: string;
  // 添加可能存在的缩略图路径字段
  pic_thumb_path?: string;
  // 添加其他可能的缩略图字段
  thumbnail?: string;
  image?: string;
  imageUrl?: string;
  img?: string;
  imgUrl?: string;
  // 文件相关字段
  files: {
    video: string | null;
    thumbnail: string | null;
    wav: string | null;
    subtitles: {
      en_json: string | null;
      zh_json: string | null;
      ass: string | null;
      en_md: string | null;
      zh_md: string | null;
    }
  };
  // 允许其他未知字段
  [key: string]: any;
}

// 前端展示用的视频数据结构
export interface VideoDisplay {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  source: string;
  thumbnail?: string;
  hash_name: string;
}

// 视频数据类型定义
export interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  time: string;
  timestamp: string;
  source: string;
  hash_name?: string; // 添加hash_name字段，但设为可选
}

/**
 * 生成模拟视频数据
 */
function generateMockVideos(): VideoDisplay[] {
  const sources = ['YouTube', 'Podcast', '本地文件'];
  const statuses = ['处理中', '已完成', '失败'];
  
  console.log('生成模拟数据...');
  
  return Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - i);
    
    // 使用明显的标记，便于识别模拟数据
    return {
      id: `mock-${i + 1}`,
      title: `[模拟] 示例视频 ${i + 1}`,
      description: `[模拟数据] 处理状态: ${statuses[i % statuses.length]}`,
      time: formatRelativeTime(date),
      timestamp: format(date, 'HH:mm'),
      source: `${sources[i % sources.length]} (模拟)`,
      thumbnail: undefined,
      hash_name: `mock-hash-${i + 1}`
    };
  });
}

/**
 * 从后端获取视频列表
 */
export async function getVideos(): Promise<any[]> {
  try {
    console.log('获取视频列表...');
    
    // 检查后端服务状态
    const isBackendAvailable = await checkBackendStatus();
    if (!isBackendAvailable) {
      console.warn('后端服务不可用，无法获取视频数据');
      return [];
    }
    
    // 直接从/videos端点获取数据
    const response = await axios.get(`${API_BASE_URL}/videos`, { 
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('视频列表响应:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object' && response.data.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return [];
  }
}

/**
 * 删除视频
 */
export async function deleteVideo(hash_name: string): Promise<boolean> {
  try {
    await axios.delete(`${API_BASE_URL}/video/${hash_name}`);
    return true;
  } catch (error) {
    console.error('删除视频失败:', error);
    return false;
  }
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  } else if (diffInDays < 30) {
    return `${diffInDays}天前`;
  } else {
    return format(date, 'yyyy-MM-dd', { locale: zhCN });
  }
}

/**
 * 根据URL识别视频来源
 */
function getVideoSource(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'YouTube';
  } else if (url.includes('podcasts.apple.com')) {
    return 'Podcast';
  } else {
    return '本地文件';
  }
}

/**
 * 添加新视频
 */
export async function addVideo(url: string): Promise<VideoDisplay | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}/process`, { url });
    const video: Video = response.data;
    
    // 转换为前端展示格式
    return {
      id: String(video.id),
      title: video.title,
      description: `处理状态: ${video.status}`,
      time: formatRelativeTime(new Date(video.created_at)),
      timestamp: format(new Date(video.created_at), 'HH:mm'),
      source: getVideoSource(video.url),
      thumbnail: video.files.thumbnail || undefined,
      hash_name: video.hash_name
    };
  } catch (error) {
    console.error('添加视频失败:', error);
    return null;
  }
}

/**
 * 从后端获取原始视频数据库数据
 */
export async function getVideoData(): Promise<any[]> {
  try {
    console.log('获取原始视频数据库数据...');
    
    // 检查后端服务状态
    const isBackendAvailable = await checkBackendStatus();
    if (!isBackendAvailable) {
      console.warn('后端服务不可用，无法获取原始数据');
      return [];
    }
    
    // 使用/videos端点而不是/video/data端点
    const response = await axios.get(`${API_BASE_URL}/videos`, { 
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('原始视频数据库响应:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object' && response.data.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('获取原始视频数据失败:', error);
    return [];
  }
}

/**
 * 将原始视频数据转换为首页需要的格式
 */
export const getVideoDataForHome = async (): Promise<VideoDisplay[]> => {
  try {
    const response = await getVideos();
    console.log('从API获取的原始视频数据:', response);
    
    if (!response || !Array.isArray(response)) {
      console.error('API返回的数据格式不正确:', response);
      return [];
    }
    
    return response.map((video: any) => {
      try {
        // 处理缩略图URL
        let thumbnailUrl = '';
        
        // 首先检查是否有files.thumbnail
        if (video.files && video.files.thumbnail) {
          thumbnailUrl = video.files.thumbnail;
          console.log('使用files.thumbnail作为缩略图:', thumbnailUrl);
          
          // 不需要在这里修改URL，让VideoCard组件处理
        } else if (video.hash_name) {
          // 如果没有files.thumbnail，则使用hash_name构建缩略图URL
          thumbnailUrl = `/api/video/${video.hash_name}/thumbnail`;
          console.log('使用hash_name构建缩略图URL:', thumbnailUrl);
        }
        
        // 格式化日期
        let formattedDate = '未知日期';
        let formattedTime = '--:--';
        
        if (video.created_at) {
          try {
            const date = new Date(video.created_at);
            formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          } catch (dateError) {
            console.error('日期格式化错误:', dateError);
          }
        }
        
        return {
          id: video.id || '',
          title: video.title || '未命名视频',
          description: video.description || '无描述信息',
          thumbnail: thumbnailUrl,
          time: formattedDate,
          timestamp: formattedTime,
          source: '本地上传',
          hash_name: video.hash_name || '',
        };
      } catch (itemError) {
        console.error('处理单个视频数据时出错:', itemError, video);
        return {
          id: video.id || '',
          title: video.title || '数据处理错误',
          description: '视频数据处理过程中出现错误',
          thumbnail: '',
          time: '未知日期',
          timestamp: '--:--',
          source: '本地上传',
          hash_name: video.hash_name || '',
        };
      }
    });
  } catch (error) {
    console.error('获取视频数据时出错:', error);
    return [];
  }
}; 