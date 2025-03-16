import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  fastRefresh: {},
  hash: true,
  routes: [
    {
      path: '/',
      component: '@/layouts/AppLayout',
      routes: [
        { path: '/', component: '@/pages/Home/index' },
        { path: '/video-data', component: '@/pages/VideoData/index' },
        { path: '/video/:hash_name', component: '@/pages/VideoPlayer/index' },
        { path: '/transcript/:hash_name', component: '@/pages/TranscriptPage/index' },
        { path: '/logs', component: '@/pages/LogViewer/index' },
      ],
    },
  ],
  antd: {},
  dva: {},
  devServer: {
    port: 8002,
  },
  lessLoader: {
    javascriptEnabled: true,
  },
  theme: {
    '@primary-color': '#1890ff',
  },
  extraBabelPlugins: [
    ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }]
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:8001',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
    '/videos': {
      target: 'http://localhost:8001',
      changeOrigin: true,
    },
    '/video': {
      target: 'http://localhost:8001',
      changeOrigin: true,
    },
    '/data': {
      target: 'http://localhost:8001',
      changeOrigin: true,
    },
    '/file': {
      target: 'http://localhost:8001',
      changeOrigin: true,
    },
    '/health': {
      target: 'http://localhost:8001',
      changeOrigin: true,
    },
  },
}); 