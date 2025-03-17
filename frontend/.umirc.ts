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
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
      onError: (err, req, res) => {
        console.log('代理请求错误:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: '后端服务未启动或无法访问' }));
      },
    },
  },
}); 