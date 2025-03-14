import React from 'react';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import logger from '@/utils/logger';

// 初始化日志系统
logger.info('应用启动', { version: '0.0.9', env: process.env.NODE_ENV });

// 在开发环境中启用服务器日志
if (process.env.NODE_ENV === 'development') {
  logger.enableServerLog(true);
  logger.debug('开发环境启用服务器日志');
}

// 全局错误处理
window.addEventListener('error', (event) => {
  logger.error('全局错误', { 
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack
  });
  
  // 显示错误通知
  message.error(`发生错误: ${event.message}`);
  
  // 阻止默认处理
  event.preventDefault();
});

// 未捕获的Promise错误
window.addEventListener('unhandledrejection', (event) => {
  logger.error('未捕获的Promise错误', { 
    reason: event.reason?.message || event.reason,
    stack: event.reason?.stack
  });
  
  // 显示错误通知
  message.error(`未处理的Promise错误: ${event.reason?.message || '未知错误'}`);
  
  // 阻止默认处理
  event.preventDefault();
});

// Configure Ant Design global settings
export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider locale={zhCN}>
      {container}
    </ConfigProvider>
  );
} 