# 宠友邻 PetNeighbor

宠友邻是一个面向同城宠物主人和兼职铲屎官的 Web MVP。当前项目重点覆盖：统一首页、登录与身份切换、宠物主人发单与订单管理、铲屎官任务大厅与接单记录、宠物档案、社区动态、在线客服。

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Vue Router + Element Plus
- 后端：Python 3.12 + FastAPI + Pydantic
- 数据层：当前以 Mock Store / 前端 Mock fallback 为主，已提供 PostgreSQL + PostGIS 初始化脚本
- 基础设施：Docker Compose 编排 PostgreSQL(PostGIS) 与 Redis
- 地图：高德地图 Web API，可无 Key 降级展示

## 目录结构

```text
patFiveCat/
├─ backend/                 FastAPI API、Schema、Mock Store、PostGIS SQL
├─ frontend/                Vue 3 Web 应用
├─ docs/                    产品、部署、数据库与当前系统文档
├─ scripts/                 Windows 本地启动/停止/初始化脚本
├─ docker-compose.yml       PostgreSQL(PostGIS) + Redis 本地编排
└─ README.md
```

## 当前已实现功能

- 首页：登录与未登录展示保持一致，包含品牌 Hero、服务类目、平台保障、附近待接任务预览、社区精选。
- 登录注册：手机号验证码演示登录、微信扫码演示登录，支持宠物主人 / 铲屎官身份选择。
- 身份切换：登录后可在顶部头像菜单切换“宠物主人 / 兼职铲屎官”。
- 宠物主人：
  - 找服务页面：发布需求表单、地图/半径演示、附近可接单铲屎官列表。
  - 发单大厅：填写订单、服务时间、宠物信息、疫苗情况、地址取点，自动计价。
  - 我的订单：按状态筛选、搜索、支付、确认完成、申诉、退款、取消。
  - 个人中心：账户信息、宠物档案、常用工具。
- 铲屎官：
  - 任务大厅：任务筛选、任务列表、右侧任务详情，支持在线沟通与立即抢单演示。
  - 接单记录：查看待服务 / 进行中 / 已完成 / 已取消任务，展示收入统计、订单卡片、打卡/出发/导航入口。
  - 个人中心：服务表现、身份资料、工作台、最近评价。
- 宠物档案：新增宠物，维护宠物基本资料、体重、习惯、照片等。
- 社区：帖子瀑布流、话题筛选、发帖、图片上传预览、作者删除自己的帖子。
- 在线客服：全局右下角浮窗；登录用户可同步历史消息，未登录用户可创建临时咨询会话。
- 后端 API：认证、用户、宠物、订单状态流转、社区、客服、首页概览。

## API 概览

后端默认前缀：`/api/v1`

- `POST /auth/phone`：手机号验证码登录
- `POST /auth/wechat`：微信扫码演示登录
- `GET /home/overview`：首页聚合数据
- `GET /users/me`：当前用户资料
- `PATCH /users/me/role`：切换身份
- `PATCH /users/me/location`：更新位置
- `GET /users/me/pets` / `POST /users/me/pets`：宠物列表与新增宠物
- `GET /orders`：订单列表
- `GET /orders/nearby`：附近待接订单
- `POST /orders`：发布订单
- `POST /orders/{id}/pay`：支付
- `POST /orders/{id}/accept`：接单
- `POST /orders/{id}/start`：开始服务
- `POST /orders/{id}/complete`：完成服务
- `POST /orders/{id}/confirm`：宠物主人确认并评价
- `POST /orders/{id}/appeal`：申诉
- `POST /orders/{id}/refund`：退款
- `POST /orders/{id}/cancel`：取消
- `GET /posts` / `POST /posts` / `DELETE /posts/{id}`：社区帖子
- `POST /support/temporary-session`：临时客服会话
- `GET /support/messages` / `POST /support/messages`：客服消息

更完整的接口和数据说明见 [当前系统完整功能、接口与数据库文档](docs/current-system-documentation.md)。

## 数据库现状

项目已提供 PostgreSQL + PostGIS 初始化 SQL，包含：

- `users`
- `pets`
- `orders`
- `posts`
- `reviews`
- `nearby_pending_orders` 视图

当前默认运行仍以 Mock Store 为主，只有部分宠物新增逻辑会尝试写入 PostgreSQL 以演示持久化路径。真实生产化还需要补齐订单全字段、客服会话、订单宠物关联等表结构。详见 [数据库 ER 结构说明文档](docs/database-er-structure.md)。

## 本地启动

### 1. 首次准备

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
```

脚本会生成 `.env`，安装后端依赖，并安装前端依赖。

### 2. 启动本地演示

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

启动后访问：

- 前端：`http://127.0.0.1:5174/`
- 后端：`http://127.0.0.1:8000/`
- Swagger：`http://127.0.0.1:8000/docs`

### 3. 可选启动数据库与 Redis

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1 -WithInfra
```

需要本机已安装并启动 Docker Desktop。

### 4. 停止服务

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
```

## 推荐演示路径

1. 打开首页，观察统一首页展示。
2. 登录为宠物主人，进入“找服务”和“我的订单”，演示发单、支付、确认、申诉/退款。
3. 切换为铲屎官，进入“任务大厅”，查看任务详情并抢单。
4. 点击“接单记录”，查看进行中任务、收入统计和打卡入口。
5. 进入个人中心，对比宠物主人与铲屎官不同展示。
6. 打开右下角在线客服，演示登录/未登录咨询。
7. 进入社区发布动态并删除自己的帖子。

## 当前边界与后续建议

- 登录、微信扫码、短信验证码、支付均为演示逻辑。
- 默认数据存储为内存 Mock，刷新后由种子数据恢复。
- Redis 容器已提供，但业务层尚未接入。
- PostgreSQL/PostGIS 结构已具备基础骨架，但尚未完全覆盖当前前端功能。
- 下一阶段建议优先做真实仓储层、鉴权、支付、客服持久化、订单状态锁和媒体上传。
