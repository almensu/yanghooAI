# YanghooAI 前端

这是YanghooAI视频应用的前端部分，使用React、UmiJS和Ant Design构建。

## 技术栈

- React
- UmiJS
- Ant Design 4.24.8
- TypeScript
- Less

## 目录结构

```
frontend/
├── src/                # 源代码
│   ├── components/     # 组件
│   ├── layouts/        # 布局组件
│   ├── pages/          # 页面
│   ├── services/       # API服务
│   └── global.less     # 全局样式
├── .umirc.ts           # UmiJS配置
├── package.json        # 依赖配置
├── tsconfig.json       # TypeScript配置
└── README.md           # 说明文档
```

## 安装与运行

1. 安装依赖:
```bash
npm install
```

2. 启动开发服务器:
```bash
npm start
```

3. 构建生产版本:
```bash
npm run build
```

## 主要功能

- YouTube风格的视频列表页面
- 视频卡片组件，支持删除功能
- 响应式布局设计 