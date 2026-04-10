# 宠友邻 PetNeighbor

宠友邻是一个面向同城宠主和兼职铲屎官的 Web 平台原型，核心围绕四件事展开：身份切换、地图发单、即时接单、宠物社区。

## 技术栈

- 前端：Vue 3 + Vite + Element Plus
- 后端：Python 3.12 + FastAPI
- 数据库：PostgreSQL + PostGIS
- 缓存：Redis
- 地图：高德地图 Web API
- 媒体存储：阿里云 / 腾讯云 OSS

## 目录结构

```text
petneighbor/
├─ backend/                 FastAPI API、演示数据、PostGIS 初始化 SQL
├─ frontend/                Vue 3 + Element Plus Web 应用
├─ docs/                    产品和架构说明
├─ docker-compose.yml       PostgreSQL(PostGIS) + Redis 本地编排
└─ README.md
```

## 已实现的 MVP 范围

- 首页：品牌展示、平台指标、附近待接任务、社区精选
- 登录：微信扫码登录占位流程、手机号验证码登录流程
- 身份切换：宠主 / 兼职铲屎官一键切换
- 发单大厅：订单表单、服务类型、时间、价格、经纬度取点、接单列表
- 社区：发布宠物动态、标签流、瀑布流展示
- 个人中心：宠物档案、信誉信息、阶段路线图
- 后端接口：登录、首页概览、个人资料、宠物列表、订单、接单、社区动态
- 数据设计：PostGIS 表结构初始化脚本

## 本地启动

### 首次准备

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
```

### 一键启动推荐

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

启动后默认访问：

- 前端：`http://127.0.0.1:5174`
- 后端：`http://127.0.0.1:8000`

脚本会自动完成以下事情：

- 如果 `frontend/.env` 或 `backend/.env` 不存在，则自动从 `.env.example` 生成。
- 启动 FastAPI 后端和 Vite 前端，并把日志写到 `.logs/`。
- 在 `.logs/frontend.pid` 和 `.logs/backend.pid` 中记录进程号，方便关闭。

停止服务：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
```

如果你还希望同时拉起 PostgreSQL 和 Redis，可以执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1 -WithInfra
```

### 手动启动方式

#### 1. 启动基础设施

```bash
docker compose up -d
```

#### 2. 启动后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

默认情况下 `USE_MOCK_DATA=true`，所以即使没有先接数据库，页面也能先跑演示闭环。

#### 3. 启动前端

```bash
cd frontend
copy .env.example .env
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5174
```

如果要启用高德地图点击取点，请在 `frontend/.env` 中填写 `VITE_AMAP_KEY`。

## 后续建议

1. 接入真实微信开放平台扫码登录和短信验证码服务商。
2. 使用 SQLAlchemy + Alembic 正式接 PostgreSQL/PostGIS，并把演示仓储替换为真实仓储层。
3. 增加 Redis 附近任务缓存、订单状态锁、WebSocket 即时通知。
4. 接入 OSS 上传服务，支持宠物照片、动态视频、服务凭证。
5. 补齐评价、实名认证、违约申诉和支付闭环。


