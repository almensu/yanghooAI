import React from 'react';
import { Menu } from 'antd';
import { useHistory, useLocation } from 'umi';
import { HomeOutlined, DatabaseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import styles from './AppLayout.less';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const history = useHistory();
  const { pathname } = location;
  
  const handleMenuClick = (path: string) => {
    history.push(path);
  };
  
  return (
    <div className={styles.appContainer}>
      <div className={styles.sider}>
        <div className={styles.topSection}>
          <div className={styles.logo}>Yanghoovidio</div>
          <Menu
            mode="inline"
            selectedKeys={[pathname === '/' ? '1' : pathname === '/video-data' ? '2' : '']}
            className={styles.topMenu}
            style={{ 
              borderRight: 'none',
              background: '#F9F9F9'
            }}
          >
            <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => handleMenuClick('/')}>
              首页
            </Menu.Item>
            <Menu.Item key="2" icon={<DatabaseOutlined />} onClick={() => handleMenuClick('/video-data')}>
              视频数据
            </Menu.Item>
          </Menu>
        </div>
        
        <div className={styles.bottomSection}>
          <Menu
            mode="inline"
            className={styles.bottomMenu}
            style={{ 
              borderRight: 'none',
              background: '#F9F9F9'
            }}
          >
            <Menu.Item key="3" icon={<QuestionCircleOutlined />}>帮助与支持</Menu.Item>
          </Menu>
        </div>
      </div>
      <div className={styles.mainContent}>
        {children}
      </div>
    </div>
  );
};

export default AppLayout; 