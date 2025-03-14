# 项目结构调整记录

## 日期
2023-11-15

## 调整内容
将项目重组为前后端分离的结构，创建了独立的前端和后端文件夹。

### 前端调整
- 创建了 `frontend/` 文件夹
- 将所有前端相关文件移动到 `frontend/` 文件夹中:
  - `src/` 目录 (React组件和页面)
  - `.umirc.ts` (UmiJS配置)
  - `package.json` 和 `package-lock.json` (依赖配置)
  - `tsconfig.json` (TypeScript配置)
  - `typings.d.ts` (TypeScript类型定义)
  - `.env` (环境变量)
  - `.cursorrules` (编辑器配置)
  - `node_modules/` (依赖包)
- 创建了 `frontend/README.md` 文件，描述前端项目结构和开发指南

### 后端调整
- 创建了 `backend/` 文件夹及其基本结构:
  - `app/` 目录 (应用代码)
    - `api/` 目录 (API路由)
    - `main.py` (应用入口)
  - `tests/` 目录 (测试代码)
  - `docs/` 目录 (文档)
- 创建了 `backend/requirements.txt` 文件，列出后端依赖
- 创建了 `backend/README.md` 文件，描述后端项目结构和开发指南

### 根目录调整
- 更新了根目录的 `README.md` 文件，描述整个项目的结构和开发指南
- 保留了 `.git`、`.gitignore` 和 `docs/` 在根目录

## 新的项目结构
```
/
├── frontend/           # 前端代码 (React, UmiJS, Ant Design)
│   ├── src/            # 源代码
│   ├── .umirc.ts       # UmiJS配置
│   ├── package.json    # 依赖配置
│   └── ...
├── backend/            # 后端代码 (FastAPI, SQLAlchemy)
│   ├── app/            # 应用代码
│   ├── requirements.txt # 依赖配置
│   └── ...
├── docs/               # 项目文档
└── README.md           # 项目说明
```

## 目的
这次调整的目的是将前端和后端代码分离，使项目结构更加清晰，便于独立开发和部署。前后端分离的架构更有利于团队协作和项目扩展。 