# [001] 修复后端静态文件路径问题

Date: 2024-03-14

## Changes

修复了FastAPI应用程序中的静态文件路径问题，使应用程序能够正确启动和运行。

1. 修改了`main.py`中的静态文件目录路径，将相对路径从项目子目录改为项目根目录：
   - 将`"frontend"`改为`"../frontend"`
   - 将`"data"`改为`"../data"`
   - 将默认缩略图路径`"frontend/assets/default-thumbnail.jpg"`改为`"../frontend/assets/default-thumbnail.jpg"`
   - 将目录创建路径`"frontend/assets"`改为`"../frontend/assets"`

2. 使用uvicorn启动FastAPI应用程序，而不是直接运行Python脚本：
   ```bash
   cd /Volumes/2T/com/yanghoo205/img2ui-ant.design/backend && uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## Related Files Changed

- `/backend/main.py`

## Dependencies Updated

- 安装了以下Python包：
  - fastapi
  - uvicorn
  - python-multipart
  - pillow
  - sqlalchemy 