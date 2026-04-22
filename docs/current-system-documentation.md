# 当前系统完整功能、接口与数据库文档

本文档基于当前代码仓的前端页面、后端路由、Pydantic Schema、Mock Store、Docker 与 SQL 初始化脚本整理。它描述的是当前系统已经具备的能力，以及数据库设计与当前功能之间仍需补齐的差异。

## 1. 系统概览

项目名称：`PetNeighbor / 宠友邻`

产品定位：

- 面向同城宠物主人和兼职铲屎官的宠物互助服务平台。
- 宠物主人可以发布代遛狗、上门喂养、家庭寄养等需求。
- 铲屎官可以在任务大厅筛选任务、查看任务详情、在线沟通并抢单。
- 平台提供首页展示、订单流转、宠物档案、社区动态、在线客服和基础个人中心。

当前系统是 Web MVP。前端页面和后端接口已经可以演示完整主流程，但默认数据源仍是内存 Mock Store，PostgreSQL/PostGIS 当前主要作为部署基建和部分宠物档案持久化尝试存在。

## 2. 技术架构

### 2.1 前端

- 框架：`Vue 3`
- 语言：`TypeScript`
- 路由：`Vue Router`
- UI 组件：`Element Plus`
- 图标：`lucide-vue-next`
- 样式入口：`frontend/src/styles/base.css`
- API 封装：`frontend/src/api/client.ts`
- Mock 退化：`frontend/src/api/mock.ts`
- 会话状态：`frontend/src/store/session.ts`

### 2.2 后端

- 框架：`FastAPI`
- Schema：`Pydantic`
- API 路由前缀：`/api/v1`
- 路由汇总：`backend/app/api/router.py`
- 内存数据服务：`backend/app/services/store.py`
- 订单规则：`backend/app/services/order_rules.py`
- 演示数据：`backend/app/data/mock_data.py`

### 2.3 数据库与中间件

- 数据库：`PostgreSQL + PostGIS`
- 缓存容器：`Redis`
- 容器编排：`docker-compose.yml`
- 初始化脚本：`backend/sql/init_postgis.sql`

当前 Redis 已有容器配置，但业务代码尚未实际读写 Redis。

## 3. 目录说明

| 路径 | 说明 |
| --- | --- |
| `frontend/src/layouts/AppShell.vue` | 全局布局、导航、页脚、浮动客服 |
| `frontend/src/views` | 主要页面视图 |
| `frontend/src/components` | 地图选择、订单卡片、帖子卡片等组件 |
| `frontend/src/api` | 前端 API 客户端与本地 Mock |
| `frontend/src/types/app.ts` | 前端业务类型 |
| `backend/app/api/routes` | 后端业务路由 |
| `backend/app/schemas` | 请求与响应模型 |
| `backend/app/services` | Mock Store 与业务规则 |
| `backend/sql` | 数据库初始化 SQL |
| `docs` | 产品、部署、数据库与系统文档 |

## 4. 前端路由与页面

前端采用 Hash 路由，主布局挂载在 `/` 下。

| 路由 | 页面 | 当前能力 |
| --- | --- | --- |
| `/` | 首页 | 未登录、宠物主人登录、铲屎官登录时保持一致 |
| `/auth` | 登录页 | 手机号验证码登录、微信模拟登录、角色选择 |
| `/services` | 找服务 / 任务大厅 | 宠物主人显示找服务，铲屎官显示任务大厅 |
| `/orders` | 订单大厅 / 接单记录 | 铲屎官进入时用于展示接单记录 |
| `/orders?entry=take` | 接单记录 | 铲屎官接单记录页面 |
| `/my-orders` | 我的订单 | 宠物主人订单中心 |
| `/profile` | 个人中心 | 宠物主人/铲屎官不同资料页 |
| `/pets/new` | 新增宠物 | 创建宠物档案 |
| `/community` | 社区 | 帖子列表、发帖、删帖 |
| `/service-guide` | 服务说明 | 平台服务说明 |
| `/city-coverage` | 城市覆盖 | 城市服务范围说明 |
| `/about` | 关于平台 | 平台介绍 |

## 5. 登录与导航行为

### 5.1 登录状态

前端会话保存在 `localStorage`，键名为 `petneighbor.session`。保存内容包括：

- `currentUser`
- `pets`
- `authToken`

系统支持两个角色：

- `owner`：宠物主人
- `sitter`：铲屎官

### 5.2 首页一致性

当前首页在三种状态下保持同一套展示：

- 未登录
- 宠物主人登录
- 铲屎官登录

首页不再因为登录身份切换成不同首屏。

### 5.3 导航差异

宠物主人登录时：

- `/services` 导航名称为“找服务”
- `/orders` 导航名称为“我的订单”

铲屎官登录时：

- `/services` 导航名称为“任务大厅”
- `/orders` 导航名称为“接单记录”

联系客服入口保持全局可用，功能不随这些页面改动而变化。

## 6. 当前前端功能

### 6.1 全局布局与客服

文件：`frontend/src/layouts/AppShell.vue`

已实现：

- 顶部品牌、城市、主导航、用户入口。
- 移动端底部导航。
- 全局浮动联系客服按钮。
- 客服弹窗支持登录用户对话和未登录临时会话。
- 未登录用户可选择先登录，也可进入临时客服对话。

客服接口对应：

- `POST /api/v1/support/temporary-session`
- `GET /api/v1/support/messages`
- `POST /api/v1/support/messages`

### 6.2 首页

文件：`frontend/src/views/HomeView.vue`

已实现：

- 品牌首屏、服务类目、平台数据、保障说明、用户口碑。
- 调用 `fetchHomeOverview()` 获取聚合数据。
- 登录和未登录状态保持同版首页。

### 6.3 登录页

文件：`frontend/src/views/AuthView.vue`

已实现：

- 手机号 + 验证码登录。
- 微信模拟登录。
- 角色选择。
- 登录成功后写入 session store。

### 6.4 宠物主人找服务

文件：`frontend/src/views/ServicesView.vue`

宠物主人视角下，页面仍为“找服务”，用于展示服务能力与可预约/可联系的铲屎官信息。

### 6.5 铲屎官任务大厅

文件：`frontend/src/views/ServicesView.vue`

铲屎官登录后，导航“找服务”显示为“任务大厅”。当前页面为三栏自适应布局：

- 左侧：任务筛选，包括服务类型、距离范围、时间要求、报酬区间。
- 中间：任务列表，包括服务标签、宠物名称、描述、距离、时间、发布人和报酬。
- 右侧：任务详情，包括顶部图片、宠物头像、地址、任务标题、托管状态、时间要求、接送地址、宠物详情、主人嘱咐、主人资料、在线沟通和立即抢单按钮。

右侧详情根据上传图合并后的效果实现。内容区域可滚动，底部“在线沟通 / 立即抢单”固定在详情卡片底部。主人实名认证位置使用图片资源：

`frontend/public/images/liteNameincon.png`

### 6.6 宠物主人订单中心

文件：`frontend/src/views/MyOrdersView.vue`

已实现：

- 按订单状态筛选。
- 搜索订单。
- 展示待付款、待服务、服务中、待确认、售后等状态。
- 支持支付、取消、确认完成、申诉、退款等演示动作。

### 6.7 铲屎官接单记录

文件：`frontend/src/views/OrdersView.vue`

铲屎官登录后，导航“我的订单”显示为“接单记录”。页面内容包括：

- 标题“接单记录”。
- 本月预计收入和完成单量统计。
- 状态 Tabs：待服务、进行中、已完成、已取消。
- 服务卡片：宠物图片、服务类型、宠物名称、地址、服务时间、预计报酬、宠主电话。
- 操作按钮：开始服务（打卡）、准备出发、导航。
- 页面布局按 Web 端浏览器宽度自适应。

### 6.8 个人中心

文件：`frontend/src/views/ProfileView.vue`

宠物主人视角：

- 展示个人资料。
- 展示宠物档案。
- 展示订单入口。

铲屎官视角：

- 展示头像、姓名、评分、服务区域、订单量、收入、评价数。
- 展示核心表现数据。
- 展示身份资料、从业经验、可接类型、个人简介。
- 展示工作台：排期管理、历史订单、收入明细、评价管理。
- 展示最近评价。

### 6.9 新增宠物

文件：`frontend/src/views/AddPetView.vue`

已实现：

- 填写宠物昵称、类型、品种、年龄、体重、习惯、紧急电话等。
- 支持创建宠物档案。
- 后端 `MockStore` 会尝试把新宠物写入 PostgreSQL，失败时仍保留内存数据。

### 6.10 社区

文件：`frontend/src/views/CommunityView.vue`

已实现：

- 帖子列表。
- 发布帖子。
- 删除本人帖子。
- 展示作者、标签、媒体、点赞数和时间。

## 7. 前端数据流

### 7.1 API 调用策略

`frontend/src/api/client.ts` 是前端统一 API 层。调用策略为：

1. 优先请求后端 `/api/v1` 接口。
2. 如果后端不可用或请求失败，使用 `frontend/src/api/mock.ts` 中的本地 Mock。
3. 前端页面拿到统一格式的数据后渲染。

### 7.2 关键类型

前端业务类型集中在 `frontend/src/types/app.ts`，包括：

- `UserProfile`
- `PetItem`
- `OrderItem`
- `OrderStatus`
- `PostItem`
- `SupportMessage`
- `SupportConversation`

## 8. 后端接口总览

所有接口前缀为 `/api/v1`。

### 8.1 Auth

#### `POST /api/v1/auth/phone`

手机号验证码登录。

请求体：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `phone` | string | 手机号 |
| `code` | string | 验证码，当前为演示逻辑 |
| `role` | string | `owner` 或 `sitter` |

响应：`LoginResponse`

| 字段 | 说明 |
| --- | --- |
| `access_token` | 演示 token |
| `user` | 用户资料 |

#### `POST /api/v1/auth/wechat`

微信模拟登录。

请求体：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | string | 模拟微信 code |
| `role` | string | `owner` 或 `sitter` |

响应：`LoginResponse`

### 8.2 Home

#### `GET /api/v1/home/overview`

获取首页聚合数据。

查询参数：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `user_id` | int | `1` | 演示用户 ID |

响应：前端类型 `HomeOverview`，后端当前以 `dict` 返回。

主要字段：

- `user`
- `stats`
- `nearby_orders`
- `posts`

### 8.3 Users

#### `GET /api/v1/users/me`

获取当前用户资料。

查询参数：

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `user_id` | int | `1` |

响应：`UserProfile`

#### `PATCH /api/v1/users/me/role`

切换用户角色。

查询参数：`user_id`

请求体：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `role` | string | `owner` 或 `sitter` |

响应：`UserProfile`

#### `PATCH /api/v1/users/me/location`

更新用户坐标。

查询参数：`user_id`

请求体：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `latitude` | number | 纬度 |
| `longitude` | number | 经度 |

响应：`UserProfile`

#### `GET /api/v1/users/me/pets`

获取当前用户宠物列表。

查询参数：`user_id`

响应：`list[PetItem]`

#### `POST /api/v1/users/me/pets`

新增宠物。

查询参数：`user_id`

请求体：`CreatePetRequest`

响应：`PetItem`

#### `POST /api/v1/users/send-code`

发送验证码演示接口。

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `phone` | string | 接收验证码的手机号 |

响应：`ApiMessage`

### 8.4 Orders

#### `GET /api/v1/orders`

获取订单列表。

当前后端返回 `MockStore` 中全部订单，前端按页面需求自行筛选。

响应：`list[OrderItem]`

#### `GET /api/v1/orders/nearby`

获取附近订单。

查询参数：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `latitude` | number | 必填 | 当前纬度 |
| `longitude` | number | 必填 | 当前经度 |
| `radius_km` | number | `5` | 搜索半径 |

响应：`list[OrderItem]`

#### `POST /api/v1/orders`

创建订单。

请求体：`CreateOrderRequest`

关键字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `owner_id` | int | 宠物主人 ID，默认 `1` |
| `service_type` | string | 服务类型 |
| `title` | string | 订单标题 |
| `description` | string | 服务描述 |
| `service_start_time` | datetime | 服务开始时间 |
| `service_end_time` | datetime | 服务结束时间 |
| `duration_minutes` | int | 服务时长，0 到 60 |
| `pet_count` | int | 宠物数量，1 到 5 |
| `pet_species` | string | 宠物类型 |
| `pet_species_other` | string | 宠物类型为其他时必填 |
| `pet_ids` | number[] | 关联宠物 ID |
| `location` | GeoPoint | 经纬度 |
| `detailed_address` | string | 详细地址 |
| `key_handover_method` | string | 钥匙/交接方式 |
| `pet_temperament` | string | 宠物性格 |
| `vaccination_status` | string | `已齐全` 或 `未齐全` |
| `vaccination_notes` | string | 疫苗未齐全时必填 |

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/pay`

支付订单。

状态要求：`pending_payment`

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/accept`

铲屎官接单。

请求体：

| 字段 | 类型 | 默认值 |
| --- | --- | --- |
| `sitter_id` | int | `2` |

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/start`

开始服务。

状态要求：`pending_service`

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/complete`

完成服务。

状态要求：`in_service`

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/confirm`

宠物主人确认完成并评价。

请求体：`ReviewOrderRequest`

字段：

- `reviewer_name`
- `rating`
- `content`

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/appeal`

发起申诉。

请求体：

| 字段 | 类型 |
| --- | --- |
| `reason` | string |

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/refund`

申请退款。

请求体：

| 字段 | 类型 |
| --- | --- |
| `reason` | string |

响应：`OrderItem`

#### `POST /api/v1/orders/{order_id}/cancel`

取消订单。

请求体：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `cancelled_by` | string | `owner`、`sitter` 或 `system` |
| `reason` | string | 取消原因 |

响应：`OrderItem`

### 8.5 Posts

#### `GET /api/v1/posts`

获取社区帖子列表。

响应：`list[PostItem]`

#### `POST /api/v1/posts`

创建帖子。

请求体：`CreatePostRequest`

主要字段：

- `user_id`
- `content`
- `media_urls`
- `tags`

响应：`PostItem`

#### `DELETE /api/v1/posts/{post_id}`

删除帖子。

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | int | 当前用户 ID |

响应：`PostItem`

### 8.6 Support

#### `POST /api/v1/support/temporary-session`

创建未登录临时客服会话。

响应：`TemporarySupportSession`

字段：

- `session_id`
- `messages`

#### `GET /api/v1/support/messages`

获取客服消息。

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | int | 登录用户 ID，可选 |
| `guest_session_id` | string | 临时会话 ID，可选 |

响应：`list[SupportMessage]`

#### `POST /api/v1/support/messages`

发送客服消息。

查询参数：

- `user_id`
- `guest_session_id`

请求体：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `content` | string | 消息内容 |

响应：`list[SupportMessage]`

## 9. 核心后端 Schema

### 9.1 用户

`UserProfile` 主要字段：

- `id`
- `username`
- `nickname`
- `role`
- `avatar`
- `bio`
- `phone`
- `gender`
- `registered_at`
- `is_verified`
- `tags`
- `rating`
- `completed_orders`
- `location`

### 9.2 宠物

`PetItem` 主要字段：

- `id`
- `user_id`
- `name`
- `type`
- `species`
- `gender`
- `breed`
- `age`
- `weight_kg`
- `specialty`
- `habits`
- `emergency_phone`
- `photos`

### 9.3 订单

`OrderItem` 包含 `CreateOrderRequest` 的全部基础字段，并额外包含：

- `id`
- `owner_id`
- `sitter_id`
- `status`
- `price`
- `service_time`
- `distance_km`
- `created_at`
- `payment_deadline_at`
- `payment_paid_at`
- `accepted_at`
- `contacts_unlocked_at`
- `service_started_at`
- `service_completed_at`
- `completed_at`
- `cancelled_at`
- `cancelled_by`
- `cancel_reason`
- `owner_cancel_penalty`
- `pricing`
- `review`

### 9.4 帖子

`PostItem` 主要字段：

- `id`
- `user_id`
- `content`
- `media_urls`
- `like_count`
- `tags`
- `created_at`
- `author`

### 9.5 客服

`SupportMessage` 主要字段：

- `id`
- `user_id`
- `sender`
- `content`
- `created_at`

`TemporarySupportSession` 包含：

- `session_id`
- `messages`

## 10. 订单状态流

当前代码中的订单状态包括：

| 状态 | 含义 |
| --- | --- |
| `pending_payment` | 待支付 |
| `pending` | 待接单 |
| `pending_service` | 已接单，待服务 |
| `in_service` | 服务中 |
| `pending_confirmation` | 待主人确认 |
| `completed` | 已完成 |
| `appealing` | 申诉中 |
| `refunding` | 退款中 |
| `cancelled` | 已取消 |

主要流转：

1. 创建订单后进入 `pending_payment`。
2. 支付后进入 `pending`。
3. 铲屎官接单后进入 `pending_service`，并解锁双方联系方式。
4. 开始服务后进入 `in_service`。
5. 完成服务后进入 `pending_confirmation`。
6. 宠物主人确认后进入 `completed`。
7. 用户可在指定阶段发起取消、申诉或退款。

## 11. Mock Store 行为

文件：`backend/app/services/store.py`

当前 Mock Store 负责：

- 手机号和微信模拟登录。
- 首页聚合数据。
- 用户资料、角色、坐标更新。
- 宠物列表、新增宠物。
- 订单列表、附近订单、创建订单、支付、接单、开始服务、完成服务、确认、申诉、退款、取消。
- 社区帖子列表、发帖、删帖。
- 登录用户客服消息和未登录临时客服会话。

预置演示数据位于 `backend/app/data/mock_data.py`。其中包含演示用户、宠物、订单、帖子和客服消息。

## 12. 当前数据库结构

初始化 SQL：`backend/sql/init_postgis.sql`

当前已定义对象：

- `users`
- `pets`
- `orders`
- `posts`
- `reviews`
- `nearby_pending_orders` 视图

### 12.1 users

主要字段：

- `id`
- `username`
- `role`
- `avatar`
- `bio`
- `phone`
- `location geography(Point, 4326)`
- `rating`
- `completed_orders`
- `created_at`

空间索引：

- `idx_users_location`

### 12.2 pets

主要字段：

- `id`
- `user_id`
- `name`
- `type`
- `species`
- `gender`
- `breed`
- `age`
- `weight_kg`
- `specialty`
- `habits`
- `emergency_phone`
- `photos`
- `created_at`

### 12.3 orders

主要字段：

- `id`
- `owner_id`
- `sitter_id`
- `status`
- `service_type`
- `title`
- `description`
- `price`
- `service_time`
- `duration_minutes`
- `location geography(Point, 4326)`
- `pet_ids`
- `created_at`

空间索引：

- `idx_orders_location`

### 12.4 posts

主要字段：

- `id`
- `user_id`
- `content`
- `media_urls`
- `like_count`
- `tags`
- `created_at`
- `deleted_at`
- `deleted_by`

### 12.5 reviews

主要字段：

- `id`
- `order_id`
- `rating`
- `comment`
- `created_at`

### 12.6 nearby_pending_orders

该视图用于查询待接单订单，包含订单信息、主人昵称和空间坐标。

## 13. 数据库与当前功能的差异

当前 SQL 仍是早期基础结构，尚未完整覆盖当前 Web MVP。主要差异如下：

| 模块 | 当前代码已有 | SQL 当前状态 | 建议补齐 |
| --- | --- | --- | --- |
| 订单状态 | 多阶段状态流 | 约束仍偏早期 | 扩展状态枚举与时间戳字段 |
| 订单计价 | `OrderPricing` | 未建模 | 增加计价明细字段或 JSONB |
| 服务时间 | 开始/结束时间 | 仅 `service_time` | 增加 `service_start_time`、`service_end_time` |
| 宠物资料 | 前后端字段较多 | 基础字段已有 | 对齐照片、习惯、疫苗等字段 |
| 铲屎官资料 | 经验、可接类型、收入、表现 | 未独立建模 | 增加 `sitter_profiles` |
| 客服 | 登录/临时会话 | 未建表 | 增加 `support_sessions`、`support_messages` |
| 社区 | 发帖、删帖、媒体、标签 | 基础字段已有 | 增加互动表、审计字段 |
| 接单记录 | 收入、打卡、导航展示 | 未建模 | 通过订单状态、服务轨迹、结算表支撑 |

## 14. 建议目标数据库模型

正式接入数据库前，建议扩展以下表：

### 14.1 sitter_profiles

用于承载铲屎官个人中心、任务大厅和接单记录所需资料。

建议字段：

- `id`
- `user_id`
- `display_name`
- `experience_years`
- `service_area`
- `available_service_types`
- `accepted_pet_types`
- `rating`
- `completed_orders`
- `monthly_income`
- `description`
- `verified_at`
- `created_at`
- `updated_at`

### 14.2 support_sessions

用于同时支持登录用户和未登录用户客服会话。

建议字段：

- `id`
- `user_id`
- `guest_session_id`
- `channel`
- `status`
- `created_at`
- `closed_at`

### 14.3 support_messages

建议字段：

- `id`
- `session_id`
- `sender`
- `content`
- `created_at`
- `read_at`

### 14.4 order_pets

当前订单使用 `pet_ids JSONB`。正式数据库建议拆成关联表。

建议字段：

- `order_id`
- `pet_id`

### 14.5 order_events

用于记录支付、接单、出发、打卡、完成、申诉、退款等状态变化。

建议字段：

- `id`
- `order_id`
- `event_type`
- `operator_id`
- `payload`
- `created_at`

## 15. 部署与配置

主要配置文件：

- `backend/app/core/config.py`
- `backend/.env.example`
- `docker-compose.yml`

核心配置：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `API_PREFIX` | `/api/v1` | API 前缀 |
| `USE_MOCK_DATA` | `true` | 是否使用 Mock 数据 |
| `POSTGRES_DSN` | `postgresql+asyncpg://petneighbor:petneighbor@localhost:5432/petneighbor` | PostgreSQL 连接 |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis 连接 |
| `ALLOWED_ORIGINS` | 包含 `5173`、`5174` | 前端开发地址 |

常用启动方式：

```powershell
.\scripts\setup-local.ps1
.\scripts\start-local.ps1
```

手动启动：

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

访问地址：

- 前端：`http://127.0.0.1:5173/`
- 后端健康检查：`http://127.0.0.1:8000/health`
- OpenAPI：`http://127.0.0.1:8000/docs`

## 16. 当前可演示主流程

### 16.1 宠物主人

1. 进入首页。
2. 登录并选择“宠物主人”。
3. 首页保持与未登录一致。
4. 进入“找服务”查看服务内容。
5. 进入“我的订单”管理订单。
6. 新增宠物档案。
7. 进入社区发帖或浏览动态。
8. 点击联系客服打开在线客服。

### 16.2 铲屎官

1. 进入首页。
2. 登录并选择“铲屎官”。
3. 首页保持与未登录一致。
4. 导航“找服务”变为“任务大厅”。
5. 在任务大厅筛选任务、查看右侧详情、在线沟通、立即抢单。
6. 导航“我的订单”变为“接单记录”。
7. 在接单记录查看待服务/进行中/已完成/已取消任务。
8. 进入个人中心查看服务表现、身份资料、工作台和评价。

## 17. 当前边界与待完善项

- 登录验证码和微信登录仍是演示逻辑。
- 大部分业务数据仍来自内存 Mock Store。
- PostgreSQL 表结构尚未完整覆盖当前订单状态流、客服会话和铲屎官资料。
- Redis 已配置但未接入业务缓存、会话或队列。
- 任务大厅和接单记录中的部分 UI 数据为前端静态演示。
- 订单权限、支付、退款、申诉、客服审计还没有接入真实生产级实现。

## 18. 推荐下一步

1. 先扩展数据库订单表和客服表，使当前接口可以完整持久化。
2. 新增 `sitter_profiles`，支撑铲屎官个人中心、任务大厅和接单记录。
3. 将 `MockStore` 拆分为真实 Repository，并保留 Mock 作为演示模式。
4. 补充鉴权中间件，让接口不再依赖 `user_id` 查询参数。
5. 为订单状态流补充后端单元测试和端到端流程测试。
6. 根据 OpenAPI 输出生成更细的接口对接文档。
