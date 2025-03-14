/**
 * 前端日志工具
 * 支持控制台输出和可选的服务器存储
 */

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// 日志配置
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableServerLog: boolean;
  serverLogEndpoint?: string;
  appName: string;
  maxLogCount: number;
}

// 默认配置
const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableServerLog: false,
  serverLogEndpoint: '/api/logs',
  appName: 'frontend',
  maxLogCount: 1000, // 本地存储的最大日志条数
};

// 日志条目
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
  context?: string;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private storageKey = 'app_logs';

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.loadLogsFromStorage();
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 启用/禁用控制台输出
   */
  enableConsole(enable: boolean): void {
    this.config.enableConsole = enable;
  }

  /**
   * 启用/禁用服务器日志
   */
  enableServerLog(enable: boolean, endpoint?: string): void {
    this.config.enableServerLog = enable;
    if (endpoint) {
      this.config.serverLogEndpoint = endpoint;
    }
  }

  /**
   * 记录调试日志
   */
  debug(message: string, details?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, details, context);
  }

  /**
   * 记录信息日志
   */
  info(message: string, details?: any, context?: string): void {
    this.log(LogLevel.INFO, message, details, context);
  }

  /**
   * 记录警告日志
   */
  warn(message: string, details?: any, context?: string): void {
    this.log(LogLevel.WARN, message, details, context);
  }

  /**
   * 记录错误日志
   */
  error(message: string, details?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, details, context);
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 清除日志
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * 导出日志为JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 下载日志文件
   */
  downloadLogs(filename: string = 'app-logs.json'): void {
    const json = this.exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, details?: any, context?: string): void {
    // 检查日志级别
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      details,
      context: context || this.config.appName,
    };

    // 添加到内存中的日志
    this.logs.push(logEntry);
    
    // 如果超过最大日志数，删除最旧的
    if (this.logs.length > this.config.maxLogCount) {
      this.logs.shift();
    }

    // 保存到本地存储
    this.saveLogsToStorage();

    // 控制台输出
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // 发送到服务器
    if (this.config.enableServerLog) {
      this.sendToServer(logEntry);
    }
  }

  /**
   * 判断是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= configLevelIndex;
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, details, context } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, details || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, message, details || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, details || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, details || '');
        break;
    }
  }

  /**
   * 发送到服务器
   */
  private sendToServer(entry: LogEntry): void {
    if (!this.config.serverLogEndpoint) {
      return;
    }

    // 使用 fetch API 发送日志
    fetch(this.config.serverLogEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    }).catch(err => {
      // 如果发送失败，只在控制台输出错误，不再尝试发送这个错误
      if (this.config.enableConsole) {
        console.error('[Logger] Failed to send log to server:', err);
      }
    });
  }

  /**
   * 保存日志到本地存储
   */
  private saveLogsToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (e) {
      // 如果存储失败（例如超出配额），只在控制台输出错误
      if (this.config.enableConsole) {
        console.error('[Logger] Failed to save logs to localStorage:', e);
      }
    }
  }

  /**
   * 从本地存储加载日志
   */
  private loadLogsFromStorage(): void {
    try {
      const storedLogs = localStorage.getItem(this.storageKey);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (e) {
      // 如果加载失败，只在控制台输出错误
      if (this.config.enableConsole) {
        console.error('[Logger] Failed to load logs from localStorage:', e);
      }
    }
  }
}

// 创建默认日志实例
const logger = new Logger({
  appName: 'auto-ai-subtitle',
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
});

export default logger; 