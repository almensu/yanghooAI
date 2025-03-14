# YanghooAI 视频应用

这是一个全栈视频应用项目，包含前端和后端两部分。

## 项目结构

```
/
├── frontend/           # 前端代码 (React, UmiJS, Ant Design)
└── backend/            # 后端代码 (FastAPI, SQLAlchemy)
```

## 前端 (frontend/)

前端使用React、UmiJS和Ant Design构建，提供YouTube风格的视频列表界面。

详细信息请查看 [frontend/README.md](frontend/README.md)

## 后端 (backend/)

后端使用FastAPI和SQLAlchemy构建，提供视频数据API服务。

详细信息请查看 [backend/README.md](backend/README.md)

## 开发指南

### 前端开发

```bash
cd frontend
npm install
npm start
```

### 后端开发

```bash
cd backend
python -m venv venv
source venv/bin/activate  # 在Windows上使用: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 部署

前端和后端可以分别部署，也可以将前端构建后的静态文件由后端服务。

### 前端构建

```bash
cd frontend
npm run build
```

### 后端启动

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
``` 