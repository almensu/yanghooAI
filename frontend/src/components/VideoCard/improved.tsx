import React, { useMemo, useEffect, useState } from 'react';
import { Card, Typography, Image, message } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

// 生成随机颜色
const getRandomColor = () => {
  const colors = [
    '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#eb2f96', '#fa8c16', '#a0d911', '#fadb14'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 默认图片
 