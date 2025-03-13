// Mock data for videos
const mockVideos = [
  {
    id: '1',
    title: 'modelcontextprotocol',
    description: 'This repository is a collection of reference implementations for',
    time: '一个月前',
    timestamp: '16:41',
    source: 'Youtube'
  },
  {
    id: '2',
    title: 'modelcontextprotocol',
    description: 'This repository is a collection of reference implementations for',
    time: '一个月前',
    timestamp: '16:41',
    source: 'Youtube'
  },
  {
    id: '3',
    title: 'modelcontextprotocol',
    description: 'This repository is a collection of reference implementations for',
    time: '一个月前',
    timestamp: '16:41',
    source: 'Youtube'
  },
  {
    id: '4',
    title: 'modelcontextprotocol',
    description: 'This repository is a collection of reference implementations for',
    time: '一个月前',
    timestamp: '16:41',
    source: 'Youtube'
  },
  {
    id: '5',
    title: 'modelcontextprotocol',
    description: 'This repository is a collection of reference implementations for',
    time: '一个月前',
    timestamp: '16:41',
    source: 'Youtube'
  }
];

export interface Video {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  source: string;
  thumbnail?: string;
}

export async function getVideos(): Promise<Video[]> {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      resolve(mockVideos);
    }, 500);
  });
} 