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
        { path: '/', component: '@/pages/Home' },
        { path: '/video-data', component: '@/pages/VideoData' },
        { path: '/video/:hash_name', component: '@/pages/VideoPlayer' },
      ],
    },
  ],
  antd: {},
  dva: {},
  devServer: {
    port: 8000,
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
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
    '/videos': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
    '/video': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
    '/data': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}); 