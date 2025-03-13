import React from 'react';
import { Menu } from 'antd';
import styles from './AppLayout.less';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className={styles.appContainer}>
      <div className={styles.sider}>
        <div className={styles.topSection}>
          <div className={styles.logo}>Yanghoovidio</div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            className={styles.topMenu}
            style={{ 
              borderRight: 'none',
              background: '#F9F9F9'
            }}
          >
            <Menu.Item key="1">媒体</Menu.Item>
            <Menu.Item key="2">笔记</Menu.Item>
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
            <Menu.Item key="3">帮助与支持</Menu.Item>
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