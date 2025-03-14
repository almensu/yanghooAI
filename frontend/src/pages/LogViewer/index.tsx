import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Modal, 
  Tag, 
  Divider,
  message
} from 'antd';
import { 
  SearchOutlined, 
  DownloadOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import logger, { LogLevel } from '@/utils/logger';
import styles from './index.less';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// 日志级别对应的颜色
const levelColors = {
  [LogLevel.DEBUG]: '#8c8c8c',
  [LogLevel.INFO]: '#1890ff',
  [LogLevel.WARN]: '#faad14',
  [LogLevel.ERROR]: '#f5222d',
};

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载日志
  useEffect(() => {
    loadLogs();
  }, []);

  // 过滤日志
  useEffect(() => {
    filterLogs();
  }, [logs, searchText, levelFilter]);

  // 加载日志
  const loadLogs = () => {
    setLoading(true);
    try {
      const allLogs = logger.getLogs();
      setLogs(allLogs);
      setLoading(false);
    } catch (error) {
      console.error('加载日志失败:', error);
      message.error('加载日志失败');
      setLoading(false);
    }
  };

  // 过滤日志
  const filterLogs = () => {
    let filtered = [...logs];

    // 按级别过滤
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // 按搜索文本过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(lowerSearchText) || 
        (log.context && log.context.toLowerCase().includes(lowerSearchText)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(lowerSearchText))
      );
    }

    // 按时间倒序排序
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFilteredLogs(filtered);
  };

  // 查看日志详情
  const viewLogDetails = (log: any) => {
    setSelectedLog(log);
    setIsModalVisible(true);
  };

  // 下载日志
  const downloadLogs = () => {
    try {
      logger.downloadLogs();
      message.success('日志下载成功');
    } catch (error) {
      console.error('下载日志失败:', error);
      message.error('下载日志失败');
    }
  };

  // 清除日志
  const clearLogs = () => {
    Modal.confirm({
      title: '确认清除所有日志?',
      content: '此操作将清除所有本地存储的日志，无法恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        try {
          logger.clearLogs();
          setLogs([]);
          message.success('日志已清除');
        } catch (error) {
          console.error('清除日志失败:', error);
          message.error('清除日志失败');
        }
      }
    });
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => formatTime(text),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={levelColors[level as LogLevel]} style={{ fontWeight: 'bold' }}>
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '上下文',
      dataIndex: 'context',
      key: 'context',
      width: 150,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      render: (text: string) => (
        <div style={{ wordBreak: 'break-word' }}>{text}</div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          onClick={() => viewLogDetails(record)}
          icon={<InfoCircleOutlined />}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.logViewerPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTitle}>
          <Title level={2}>日志查看器</Title>
          <Text type="secondary">查看和管理应用日志</Text>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <Space>
            <Input
              placeholder="搜索日志..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
            />
            <Select 
              value={levelFilter} 
              onChange={setLevelFilter}
              style={{ width: 120 }}
            >
              <Option value="all">所有级别</Option>
              <Option value={LogLevel.DEBUG}>调试</Option>
              <Option value={LogLevel.INFO}>信息</Option>
              <Option value={LogLevel.WARN}>警告</Option>
              <Option value={LogLevel.ERROR}>错误</Option>
            </Select>
          </Space>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadLogs}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={downloadLogs}
            >
              下载日志
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={clearLogs}
            >
              清除日志
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredLogs.map((log, index) => ({ ...log, key: index }))}
          pagination={{ pageSize: 20 }}
          loading={loading}
          locale={{ emptyText: '没有找到日志记录' }}
        />
      </Card>

      {/* 日志详情模态框 */}
      <Modal
        title="日志详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedLog && (
          <div className={styles.logDetails}>
            <div className={styles.logDetailItem}>
              <strong>时间:</strong> {formatTime(selectedLog.timestamp)}
            </div>
            <div className={styles.logDetailItem}>
              <strong>级别:</strong> 
              <Tag color={levelColors[selectedLog.level as LogLevel]} style={{ fontWeight: 'bold' }}>
                {selectedLog.level.toUpperCase()}
              </Tag>
            </div>
            <div className={styles.logDetailItem}>
              <strong>上下文:</strong> {selectedLog.context || '-'}
            </div>
            <div className={styles.logDetailItem}>
              <strong>消息:</strong> {selectedLog.message}
            </div>
            
            {selectedLog.details && (
              <>
                <Divider orientation="left">详细信息</Divider>
                <div className={styles.detailsJson}>
                  <pre>
                    {typeof selectedLog.details === 'object' 
                      ? JSON.stringify(selectedLog.details, null, 2)
                      : selectedLog.details}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogViewer; 