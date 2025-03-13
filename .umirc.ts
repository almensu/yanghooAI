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
}); 