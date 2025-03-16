// 导入axios进行API请求
import axios from 'axios';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import logger from '@/utils/logger';

// API基础URL
export const API_BASE_URL = 'http://localhost:8001';

// 检查后端服务是否可用
async function checkBackendStatus(): Promise<boolean> {
  try {
    // 尝试多个端点
    const endpoints = [
      'http://localhost:8001/health',
      'http://localhost:8001/',
      '/health',
      '/'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`尝试访问端点: ${endpoint}`);
        const response = await axios.get(endpoint, { timeout: 3000 });
        if (response.status === 200) {
          console.log(`端点 ${endpoint} 可用`);
          return true;
        }
      } catch (endpointError) {
        console.error(`端点 ${endpoint} 不可用:`, endpointError);
        // 继续尝试下一个端点
      }
    }
    
    console.error('所有端点都不可用');
    return false;
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
 * 处理新视频
 */
export async function processVideo(url: string): Promise<any> {
  try {
    logger.info('开始处理视频', { url });
    
    const response = await axios.post(`${API_BASE_URL}/process`, {
      url
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    logger.info('视频处理成功', { hash_name: response.data.hash_name });
    return response.data;
  } catch (error) {
    logger.error('处理视频失败', { error, url });
    throw error;
  }
}

/**
 * 获取视频列表
 */
export async function getVideos(skip: number = 0, limit: number = 100): Promise<any[]> {
  try {
    logger.info('获取视频列表', { skip, limit });
    
    // 尝试从API获取数据
    try {
      const response = await axios.get(`${API_BASE_URL}/videos`, {
        params: { skip, limit },
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.info('获取视频列表成功', { count: response.data.length });
      return response.data;
    } catch (apiError) {
      logger.error('API请求失败，使用模拟数据', { error: apiError });
      console.log('API请求失败，使用模拟数据替代');
      return generateMockVideos();
    }
  } catch (error) {
    logger.error('获取视频列表失败', { error, skip, limit });
    // 出错时返回模拟数据
    return generateMockVideos();
  }
}

/**
 * 获取视频详情
 */
export async function getVideoDetail(hash_name: string): Promise<any> {
  try {
    logger.info('获取视频详情', { hash_name });
    
    const response = await axios.get(`${API_BASE_URL}/video/${hash_name}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    logger.info('获取视频详情成功', { hash_name });
    return response.data;
  } catch (error) {
    logger.error('获取视频详情失败', { error, hash_name });
    throw error;
  }
}

/**
 * 删除视频
 */
export async function deleteVideo(hash_name: string): Promise<boolean> {
  try {
    logger.info('删除视频', { hash_name });
    
    const response = await axios.delete(`${API_BASE_URL}/video/${hash_name}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    logger.info('删除视频成功', { hash_name });
    return response.data.status === 'success';
  } catch (error) {
    logger.error('删除视频失败', { error, hash_name });
    throw error;
  }
}

/**
 * 获取视频数据
 */
export async function getVideoData(): Promise<any[]> {
  try {
    logger.info('获取视频数据');
    console.log('开始获取视频数据...');
    
    // 尝试直接访问/video/data端点
    try {
      console.log('尝试访问/video/data端点...');
      const response = await axios.get(`${API_BASE_URL}/video/data`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      logger.info('获取视频数据成功', { count: response.data.length });
      console.log('成功从/video/data获取数据:', response.data.length);
      return response.data;
    } catch (directError) {
      console.error('直接访问/video/data失败:', directError);
      
      // 尝试通过API前缀访问
      try {
        console.log('尝试访问/api/video/data端点...');
        const apiResponse = await axios.get(`${API_BASE_URL}/api/video/data`, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        logger.info('通过API前缀获取视频数据成功', { count: apiResponse.data.length });
        console.log('成功从/api/video/data获取数据:', apiResponse.data.length);
        return apiResponse.data;
      } catch (apiError) {
        console.error('通过API前缀访问/video/data失败:', apiError);
        
        // 尝试使用相对路径
        try {
          console.log('尝试使用相对路径访问/video/data...');
          const relativeResponse = await axios.get(`/video/data`, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          });
          
          logger.info('通过相对路径获取视频数据成功', { count: relativeResponse.data.length });
          console.log('成功通过相对路径获取数据:', relativeResponse.data.length);
          return relativeResponse.data;
        } catch (relativeError) {
          console.error('通过相对路径访问/video/data失败:', relativeError);
          
          // 最后尝试使用相对路径访问API前缀
          try {
            console.log('尝试使用相对路径访问/api/video/data...');
            const relativeApiResponse = await axios.get(`/api/video/data`, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000
            });
            
            logger.info('通过相对路径API前缀获取视频数据成功', { count: relativeApiResponse.data.length });
            console.log('成功通过相对路径API前缀获取数据:', relativeApiResponse.data.length);
            return relativeApiResponse.data;
          } catch (relativeApiError) {
            console.error('通过相对路径API前缀访问/video/data失败:', relativeApiError);
            throw relativeApiError;
          }
        }
      }
    }
  } catch (error) {
    logger.error('获取视频数据失败', { error });
    console.error('所有尝试都失败，使用模拟数据替代');
    // 出错时返回模拟数据
    return generateMockVideos().map(video => ({
      ...video,
      id: parseInt(video.id.replace('mock-', '')) || Math.floor(Math.random() * 1000)
    }));
  }
}

/**
 * 获取视频字幕
 */
export async function getVideoSubtitles(hash_name: string): Promise<any> {
  try {
    logger.info('获取视频字幕', { hash_name });
    
    const response = await axios.get(`${API_BASE_URL}/video/${hash_name}/subtitles`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    logger.info('获取视频字幕成功', { hash_name });
    return response.data;
  } catch (error) {
    logger.error('获取视频字幕失败', { error, hash_name });
    throw error;
  }
}

/**
 * 获取视频的原始转写JSON
 */
export async function getOriginalTranscript(hash_name: string): Promise<any> {
  try {
    logger.info('获取视频原始转写', { hash_name });
    
    const response = await axios.get(`${API_BASE_URL}/video/${hash_name}/transcript/raw`, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    logger.info('获取视频原始转写成功', { hash_name });
    return response.data;
  } catch (error) {
    logger.error('获取原始转写JSON失败', { error, hash_name });
    throw error;
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
 * 将原始视频数据转换为首页需要的格式
 */
export const getVideoDataForHome = async (): Promise<VideoDisplay[]> => {
  try {
    // 检查后端服务是否可用
    const isBackendAvailable = await checkBackendStatus();
    if (!isBackendAvailable) {
      console.error('后端服务不可用，返回模拟数据');
      return generateMockVideos();
    }
    
    // 直接尝试多个端点获取视频数据
    let response;
    try {
      // 尝试直接获取视频列表
      console.log('尝试从/videos端点获取视频数据');
      response = await axios.get('http://localhost:8001/videos', {
        params: { skip: 0, limit: 1000 }
      });
      console.log('成功从/videos端点获取数据');
    } catch (err1) {
      console.error('从/videos端点获取数据失败:', err1);
      try {
        // 尝试从video/data端点获取
        console.log('尝试从/video/data端点获取视频数据');
        response = await axios.get('http://localhost:8001/video/data', {
          params: { skip: 0, limit: 1000 }
        });
        console.log('成功从/video/data端点获取数据');
      } catch (err2) {
        console.error('从/video/data端点获取数据失败:', err2);
        console.log('所有尝试都失败，返回模拟数据');
        return generateMockVideos();
      }
    }
    
    console.log('从API获取的原始视频数据:', response.data);
    console.log('视频数量:', response.data.length);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('API返回的数据格式不正确:', response.data);
      return generateMockVideos();
    }
    
    if (response.data.length === 0) {
      console.log('API返回空数组，没有视频数据');
      return [];
    }
    
    return response.data.map((video: any) => {
      try {
        console.log('处理视频数据:', video);
        
        // 处理缩略图URL
        let thumbnailUrl = '';
        const backendUrl = 'http://localhost:8001'; // 使用实际运行的端口
        
        // 首先检查是否有pic_thumb_path
        if (video.pic_thumb_path) {
          thumbnailUrl = `${backendUrl}${video.pic_thumb_path}`;
          console.log('使用pic_thumb_path作为缩略图:', thumbnailUrl);
        } 
        // 然后检查是否有files.thumbnail
        else if (video.files && video.files.thumbnail) {
          thumbnailUrl = video.files.thumbnail;
          console.log('使用files.thumbnail作为缩略图:', thumbnailUrl);
          
          // 确保URL是完整的
          if (thumbnailUrl.startsWith('/file/')) {
            thumbnailUrl = `${backendUrl}${thumbnailUrl}`;
          }
        } 
        // 最后使用hash_name构建缩略图URL
        else if (video.hash_name) {
          thumbnailUrl = `${backendUrl}/video/${video.hash_name}/thumbnail`;
          console.log('使用hash_name构建缩略图URL:', thumbnailUrl);
        }
        
        // 格式化日期
        let formattedDate = '未知日期';
        let formattedTime = '--:--';
        
        if (video.created_at) {
          try {
            const date = new Date(video.created_at);
            formattedDate = formatRelativeTime(date);
            formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          } catch (dateError) {
            console.error('日期格式化错误:', dateError);
          }
        }
        
        return {
          id: String(video.id) || String(Math.random()),
          title: video.title || '未命名视频',
          description: video.status || '无状态信息',
          thumbnail: thumbnailUrl,
          time: formattedDate,
          timestamp: formattedTime,
          source: getVideoSource(video.url || ''),
          hash_name: video.hash_name || '',
        };
      } catch (itemError) {
        console.error('处理单个视频数据时出错:', itemError, video);
        return {
          id: String(Math.random()),
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
    // 返回模拟数据作为后备
    return generateMockVideos();
  }
};

/**
 * 获取单个视频详情
 */
export async function getVideoByHash(hash_name: string): Promise<Video | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/video/${hash_name}`);
    return response.data;
  } catch (error) {
    console.error('获取视频详情失败:', error);
    return null;
  }
}

/**
 * 获取视频总数
 */
export async function getVideosCount(): Promise<number> {
  try {
    logger.info('获取视频总数');
    
    // 尝试从API获取数据
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/count`);
      logger.info('获取视频总数成功', { count: response.data });
      return response.data;
    } catch (apiError) {
      logger.error('获取视频总数失败', { error: apiError });
      // 如果获取失败，尝试使用相对路径
      try {
        const response = await axios.get('/videos/count');
        logger.info('通过相对路径获取视频总数成功', { count: response.data });
        return response.data;
      } catch (relativeError) {
        logger.error('通过相对路径获取视频总数失败', { error: relativeError });
        return 0;
      }
    }
  } catch (error) {
    logger.error('获取视频总数失败', { error });
    return 0;
  }
} 