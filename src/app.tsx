import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

// Configure Ant Design global settings
export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider locale={zhCN}>
      {container}
    </ConfigProvider>
  );
} 