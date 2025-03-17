import React, { useState } from 'react';
import { HomeOutlined, VideoCameraOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu, Layout } from 'antd';
import { useLocation } from 'umi';
import { history } from '@@/core/history';
import styles from './index.less';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const SideMenu: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // 根据当前路径设置选中的菜单项
  const selectedKey = location.pathname;

  // 移除设置和帮助相关的菜单项，只保留首页和视频数据库
  const items: MenuItem[] = [
    getItem('首页', '/', <HomeOutlined />),
    getItem('视频数据库', '/video-data', <VideoCameraOutlined />),
  ];

  const onClick: MenuProps['onClick'] = (e) => {
    console.log('菜单点击:', e);
    history.push(e.key);
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={(value) => setCollapsed(value)}
      width={200}
      className={styles.sider}
    >
      <div className={styles.logo} />
      <Menu
        mode="inline"
        theme="light"
        defaultSelectedKeys={['/']}
        selectedKeys={[selectedKey]}
        // 移除默认打开的子菜单设置，因为没有子菜单了
        // defaultOpenKeys={['settings', 'help']}
        style={{ height: '100%', borderRight: 0 }}
        items={items}
        onClick={onClick}
      />
    </Sider>
  );
};

export default SideMenu; 