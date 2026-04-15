# 当前系统完整功能、接口与数据库文档

## 1. 文档说明

本文档基于当前代码仓实际存在的前端、后端、模拟数据、数据库 SQL 和配置文件整理而成。
目标是说清楚目前这个项目“已经有什么”，包括：

- 前端已实现的页面与交互功能
- 后端已暴露的 API 接口与请求响应模型
- 数据库现在已经定义的表、视图与空间字段
- 项目目前还处于演示或 Mock 阶段的部分

## 2. 项目概览

项目名称：`PetNeighbor / 宠友邻`

定位：

- 面向家庭宠物养护场景的邻里互助平台
- 用户可以寻找附近的代遊、上门照料、短时寄养等服务
- 平台同时提供社区交流、宠物档案、订单发布与接单功能
- 项目现阶段以 Web MVP 形式存在，前后端都已有基础能力

当前核心业务线包括：

1. 登录与身份切换
2. 首页概览与服务展示
3. 订单发单、附近需求、接单与历史订单
4. 社区帖子列表与发帖
5. 个人档案、宠物档案、在线客服聊天

## 3. 技术栈与目录结构

### 3.1 前端

- `Vue 3`
- `TypeScript`
- `Vue Router`
- `Element Plus`
- 全局样式：`frontend/src/styles/base.css`
- 前端 API 封装：`frontend/src/api/client.ts`
- Mock 退化逻辑：`frontend/src/api/mock.ts`

### 3.2 后端

- `FastAPI`
- `Pydantic` 模型
- API 路由前缀：`/api/v1`
- 内存数据存储：`backend/app/services/store.py`
- 演示种子数据：`backend/app/data/mock_data.py`

### 3.3 数据库与中间件

- `PostgreSQL + PostGIS`（`docker-compose.yml`）
- `Redis`（已配置容器，当前业务代码未实质使用）
- 数据库初始 SQL：`backend/sql/init_postgis.sql`

### 3.4 主要目录

- `frontend/src/views`：页面视图
- `frontend/src/components`：前端组件
- `frontend/src/store`：前端会话状态
- `backend/app/api/routes`：后端路由
- `backend/app/schemas`：请求与响应 Schema
- `backend/app/services`：服务层与数据存取逻辑
- `docs`：项目说明文档

## 4. 当前系统架构说明

当前项目是“前端 + FastAPI + 内存 Mock Store + 可选 PostgreSQL/PostGIS 部署基建”的结构。
也就是说，现在后端接口是真实存在的，但默认情况下读写的是内存中的示例数据，而不是正式的数据库持久化实现。

前端调用顺序如下：

1. 页面通过 `client.ts` 发起 HTTP 请求
2. 如果后端可用，直接使用后端返回数据
3. 如果后端不可用或请求失败，则退回到 `mock.ts` 中的本地 Mock 数据
4. 用户会话存在 `localStorage` 中，键名为 `petneighbor.session`

## 5. 前端已实现页面与功能

### 5.1 全局布局

`frontend/src/layouts/AppShell.vue` 承担顶部导航、底部页脚、浮动联系客服入口等作用。

已具备能力：

- 顶部品牌展示与栏目导航
- 城市显示与登录状态提示
- 浮动客服窗口展开 / 关闭
- 未登录用户点击联系客服时可先选择身份，也可直接进入临时对话

### 5.2 首页 Home

文件：`frontend/src/views/HomeView.vue`

已实现内容：

- 品牌 Hero 区域
- 平台核心数据概览（认证护理达人、月度订单、好评率等）
- 服务类目展示
- 平台保障与用户口碑展示
- 未登录时可唤起身份选择弹窗
- 调用 `fetchHomeOverview()` 动态获取首页概览数据

### 5.3 登录页 Auth

文件：`frontend/src/views/AuthView.vue`

已实现功能：

- 手机号 + 验证码登录
- 模拟微信扫码登录
- 登录时选择角色（宠物家长 / 护理达人）
- 登录成功后写入前端 session store

### 5.4 订单页 Orders

文件：`frontend/src/views/OrdersView.vue`

已实现功能：

- 创建上门照料、遛狗、寄养等订单
- 填写服务时间、地点、价格、描述、紧急程度
- 使用 `AmapPicker.vue` 选择地理位置坐标
- 展示附近待接单订单
- 护理达人对订单执行接单
- 家长查看我的订单历史

### 5.5 社区页 Community

文件：`frontend/src/views/CommunityView.vue`

已实现功能：

- 展示宠友动态列表
- 支持发布带标题、内容、标签的帖子
- 展示发布者信息、发布时间、互动数据

### 5.6 个人中心 Profile

文件：`frontend/src/views/ProfileView.vue`

已实现功能：

- 展示用户基本资料、地点、角色
- 如果是护理达人，展示从业年限、擅长宠物、服务次数、好评率等信息
- 展示宠物档案列表
- 内嵌客服聊天面板

### 5.7 在线客服

前端同时在全局浮窗和个人页面内提供客服交互能力。

现有体验包括：

- 窗口标题为“宠友邻在线服务”
- 新对话欢迎语为“您好！欢迎使用宠友邻在线服务”
- 客服名称为“金牌铲屎官”
- 客服默认首消息包含问候语、服务引导语和联系方式
- 未登录用户可以生成临时会话进行沟通
- 临时会话不在前端本地留存聊天记录

## 6. 前端状态管理与数据流

### 6.1 Session Store

文件：`frontend/src/store/session.ts`

当前持久化字段包括：

- `currentUser`
- `pets`
- `authToken`

重新打开浏览器后会尝试从 `localStorage` 恢复上一次的登录状态。

### 6.2 API 层

文件：`frontend/src/api/client.ts`

特点：

- 统一请求后端 API
- 后端失败时可降级为 Mock 数据
- 将前端视图所需的功能封装为独立函数

## 7. 后端 API 接口清单

所有接口默认前缀为：`/api/v1`

### 7.1 Auth 认证接口

#### `POST /api/v1/auth/phone`

作用：手机号 + 验证码登录

请求体主要字段：

- `phone`
- `code`
- `role`

响应：`LoginResponse`，包含 `user`、`pets`、`token`。

#### `POST /api/v1/auth/wechat`

作用：模拟微信登录

请求体主要字段：

- `wechat_id`
- `role`

响应：`LoginResponse`

### 7.2 Home 首页接口

#### `GET /api/v1/home/overview`

作用：获取首页展示所需的聚合数据

响应主要包括：

- `city`
- `stats`
- `featuredServices`
- `trustBadges`
- `testimonials`

### 7.3 Users 用户接口

#### `GET /api/v1/users/me`

作用：获取当前用户信息

#### `PATCH /api/v1/users/me/role`

作用：切换用户角色

请求体字段：

- `role`

#### `PATCH /api/v1/users/me/location`

作用：更新当前用户所在城市与坐标

请求体字段：

- `city`
- `lat`
- `lng`

#### `GET /api/v1/users/me/pets`

作用：获取当前用户的宠物列表

#### `POST /api/v1/users/send-code`

作用：发送登录验证码（演示接口）

请求体字段：

- `phone`

响应为通用成功消息。

### 7.4 Orders 订单接口

#### `GET /api/v1/orders`

作用：查询我的订单列表

支持参数：

- `user_id`
- `role`

#### `GET /api/v1/orders/nearby`

作用：查询附近待接单订单

支持参数：

- `lat`
- `lng`
- `radius_km`

#### `POST /api/v1/orders`

作用：发布新订单

请求体主要字段：

- `service_type`
- `title`
- `description`
- `scheduled_at`
- `duration_hours`
- `price`
- `city`
- `location_text`
- `lat`
- `lng`
- `pet_types`
- `special_requirements`
- `urgent`

响应：新创建的 `Order` 对象

#### `POST /api/v1/orders/{order_id}/accept`

作用：护理达人接单

请求体字段：

- `sitter_id`

响应：更新后的 `Order` 对象

### 7.5 Posts 社区接口

#### `GET /api/v1/posts`

作用：获取社区帖子列表

#### `POST /api/v1/posts`

作用：创建社区帖子

请求体字段：

- `author_id`
- `author_name`
- `title`
- `content`
- `tags`

响应：新建 `Post` 对象

### 7.6 Support 在线客服接口

#### `POST /api/v1/support/temporary-session`

作用：为未登录用户创建临时对话 Session

响应包含：

- `session_id`
- `welcome_message`

#### `GET /api/v1/support/messages`

作用：获取客服聊天记录

支持参数：

- `user_id`（已登录场景）
- `session_id`（临时会话场景）

#### `POST /api/v1/support/messages`

作用：发送客服消息

请求体字段：

- `content`
- `sender`（`user` 或 `support`）
- `user_id`（可选）
- `session_id`（可选）

响应：新写入的 `SupportMessage` 对象

## 8. 后端 Schema / 数据模型

后端已经为下列业务定义 Pydantic 模型：

- `UserSummary`、`PetSummary`、`SitterProfile`
- `LoginWithPhoneRequest`、`LoginWithWechatRequest`、`LoginResponse`
- `HomeOverview`及配套子模型
- `Order`、`CreateOrderRequest`、`AcceptOrderRequest`
- `Post`、`CreatePostRequest`
- `SupportMessage`、`TemporarySupportSession`、`CreateSupportMessageRequest`
- `ApiMessage` 通用响应模型

这意味着 API 结构相对清晰，但目前的数据存储依然是内存模式。

## 9. 当前 Mock 数据与后端行为

`backend/app/data/mock_data.py` 预置了一批演示数据，包括：

- 3 个演示用户
- 4 只宠物
- 3 条订单
- 2 篇社区帖子
- 3 条客服消息

`StoreService` 目前负责：

- 模拟用户登录
- 返回首页聚合数据
- 按条件查询订单
- 创建订单、接单
- 发布社区帖子
- 维护客服对话和临时会话

也就是说，当前系统虚拟完成了一套可用的 API 链路，但还没有连到真实业务数据库。

## 10. 数据库设计现状

### 10.1 已提供的数据库基础设施

`docker-compose.yml` 中已定义：

- `postgres/postgis` 容器
- `redis` 容器

### 10.2 SQL 初始脚本中的表

`backend/sql/init_postgis.sql` 目前定义了以下对象：

- `users`
- `pets`
- `orders`
- `posts`
- `reviews`
- 视图 `nearby_pending_orders`

### 10.3 表结构的主要特点

- `users.location` 为 PostGIS 地理字段
- `orders.location` 为 PostGIS 地理字段
- 已为用户和订单地理信息创建空间索引
- 可以支撑基于距离的附近订单查询

### 10.4 数据库与当前代码的差距

目前 SQL 设计还没有完整对应现在的系统功能，例如：

- 还没有 `support_messages` 或 `support_sessions` 相关表
- `users` 表中对宠物护理资质、服务次数等字段不够完整
- `posts` 表未覆盖当前前端展示的所有字段
- 客服临时会话与消息留存还没有正式持久化模型

## 11. 配置与运行方式

### 11.1 后端配置

`backend/app/core/config.py` 中已配置：

- `api_prefix = /api/v1`
- `use_mock_data = True`（默认走 Mock Store）
- `allowed_origins` 已包含 `http://127.0.0.1:5173` 和 `http://127.0.0.1:5174`
- `postgres_dsn` 和 `redis_dsn` 已预留

### 11.2 运行入口

- 前端入口：`frontend/src/main.ts`
- 后端入口：`backend/app/main.py`
- 后端路由汇总：`backend/app/api/router.py`

## 12. 前端组件清单

### 12.1 `AmapPicker.vue`

- 支持选点
- 反向写入经纬度
- 无 AMap Key 时提供退化体验

### 12.2 `OrderCard.vue`

- 展示订单标题、状态、价格、时间、距离等信息

### 12.3 `PostCard.vue`

- 展示帖子作者、内容摘要、标签、互动数据

## 13. 当前已实现能力汇总

从产品角度看，目前这个项目已经完成了一个可演示 MVP 的主体闭环：

- 能登录
- 能切换家长 / 护理达人角色
- 能查首页聚合数据
- 能发布订单和接单
- 能查看我的订单与附近订单
- 能发社区帖子
- 能查看个人信息和宠物档案
- 能进行在线客服沟通（包括未登录临时对话）

## 14. 当前仍处于演示 / 待完善部分

- 后端数据存储仍然是内存 Mock，不是真实持久化
- 登录验证码、微信登录都是演示逻辑
- 订单、帖子、客服消息还没有接入正式权限、审核、风控系统
- 数据库 SQL 与当前前端 / 后端实际字段还需进一步对齐
- Redis 容器已有，但未接入业务

## 15. 建议的下一步工作

1. 先将 `StoreService` 切换为真实数据库 Repository 实现
2. 补齐 support session / support message 相关数据库表
3. 将 users / sitters / posts / orders 字段与 SQL 对齐
4. 为登录、下单、发帖、客服增加真实鉴权与审计日志
5. 再补充一份 Swagger / OpenAPI 风格的对外接口文档与 ER 图文档
