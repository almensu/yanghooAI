import React from 'react';
import { Layout, Menu, Typography, Button } from 'antd';
import { Link, useLocation } from 'umi';
import { HomeOutlined, DatabaseOutlined, FileTextOutlined, BugOutlined } from '@ant-design/icons';
import styles from './AppLayout.less';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { pathname } = location;

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/video-data',
      icon: <DatabaseOutlined />,
      label: <Link to="/video-data">视频数据库</Link>,
    },
    {
      key: '/logs',
      icon: <BugOutlined />,
      label: <Link to="/logs">日志查看</Link>,
    },
  ];

  return (
    <Layout className={styles.appLayout}>
      <Header className={styles.header}>
        <div className={styles.logo}>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>
            <FileTextOutlined /> Auto AI Subtitle
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[pathname]}
          items={menuItems}
        />
      </Header>
      <Content className={styles.content}>
        <div className={styles.contentWrapper}>
          {children}
        </div>
      </Content>
      <Footer className={styles.footer}>
        Auto AI Subtitle ©{new Date().getFullYear()} Created with ❤️
      </Footer>
    </Layout>
  );
};

export default AppLayout; 