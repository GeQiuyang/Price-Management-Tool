# 项目架构文档

## 项目概述

**项目名称**: QuoteFlow 报价管理平台 (Price Management Tool)

**项目类型**: B2B 产品报价管理系统

**技术栈**: React + Vite (前端) + Express (后端) + SQL.js/PostgreSQL (数据库)

---

## 整体架构

### 1. 技术栈

#### 前端技术栈
- **框架**: React 18.3.1
- **构建工具**: Vite 6.0.1
- **路由**: React Router DOM 6.22.0
- **状态管理**: React Hooks (useState, useEffect)
- **UI 框架**: 自定义设计 + Tailwind CSS 3.4.17
- **数据可视化**: XLSX 0.18.5 (Excel 导入导出)
- **样式**: 自定义 CSS + Tailwind CSS (Apple 风格设计)

#### 后端技术栈
- **框架**: Express 5.2.1
- **数据库**: SQL.js (浏览器端 SQLite) + PostgreSQL (生产环境)
- **缓存**: Redis 4.6.12
- **认证**: JWT (jsonwebtoken 9.0.3) + bcryptjs (密码加密)
- **安全**: Helmet, express-rate-limit, express-validator, xss-clean
- **定时任务**: node-cron
- **监控**: prom-client

#### 开发工具
- **并发运行**: concurrently
- **代码检查**: ESLint 9.15.0
- **容器化**: Docker + Docker Compose

---

## 项目结构

```
P1/
├── src/                          # 前端源代码
│   ├── components/               # 通用组件
│   │   ├── apple/               # Apple 风格组件
│   │   │   ├── AppShell.jsx     # 应用壳/布局容器
│   │   │   ├── Navbar.jsx       # 导航栏
│   │   │   ├── Footer.jsx       # 页脚
│   │   │   ├── HeroSection.jsx  # 首屏区域
│   │   │   ├── FeatureSection.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   └── Reveal.jsx       # 动画组件
│   │   ├── Layout.jsx           # 主布局组件
│   │   ├── Modal.jsx            # 模态框组件
│   │   └── Modal.css
│   ├── lib/                     # 工具库
│   │   └── api.js               # API 请求封装
│   ├── pages/                   # 页面组件
│   │   ├── Products.jsx         # 产品管理
│   │   ├── Warehouses.jsx       # 仓库管理
│   │   ├── Customers.jsx        # 客户管理
│   │   ├── QuoteGenerator.jsx   # 报价生成器
│   │   ├── FreightSimulator.jsx # 运费模拟器
│   │   ├── SystemSettings.jsx   # 系统设置
│   │   ├── AuditLogs.jsx        # 审计日志
│   │   ├── BackupRestore.jsx    # 备份恢复
│   │   ├── Currencies.jsx       # 货币管理
│   │   ├── TaxesUnits.jsx       # 税率和单位
│   │   ├── RecycleBin.jsx       # 回收站
│   │   ├── Login.jsx            # 登录页
│   │   ├── Register.jsx         # 注册页
│   │   ├── Auth.css             # 认证页面样式
│   │   └── ... (CSS 文件)
│   ├── App.jsx                  # 主应用组件
│   ├── main.jsx                 # 入口文件
│   └── index.css                # 全局样式
│
├── server/                      # 后端源代码
│   ├── config/                  # 配置文件
│   │   ├── database.js          # PostgreSQL 连接池
│   │   └── redis.js             # Redis 客户端
│   ├── controllers/             # 业务逻辑控制器
│   │   └── auth.js              # 认证控制器
│   ├── middleware/              # 中间件
│   │   ├── auth.js              # JWT 认证中间件
│   │   └── security.js          # 安全中间件
│   ├── routes/                  # API 路由
│   │   └── auth.js              # 认证路由
│   ├── backups/                 # 数据库备份
│   │   └── backup-*.db
│   ├── server.js                # 主服务器文件 (SQL.js)
│   ├── server-new.js            # 新版本服务器 (PostgreSQL)
│   ├── init-db.js               # 数据库初始化
│   └── *.js                     # 数据导入脚本
│
├── public/                      # 静态资源
│   └── logo.svg
│
├── package.json                 # 项目配置
├── vite.config.js               # Vite 配置
├── tailwind.config.js           # Tailwind CSS 配置
├── postcss.config.js            # PostCSS 配置
├── Dockerfile                   # Docker 镜像配置
├── docker-compose.yml           # Docker Compose 配置
└── *.sh / *.command            # 启动脚本
```

---

## 核心功能模块

### 1. 认证与授权系统

#### 用户角色
- **admin** (管理员): 完整权限
- **sales** (业务员): 产品管理、报价生成
- **foreign_trade** (外贸员): 只读权限

#### 认证流程
```
1. 用户登录 → 验证用户名密码
2. 生成 JWT Token (7天有效期)
3. 生成 Refresh Token (7天有效期)
4. 存储会话信息到数据库
5. 前端存储 token 到 localStorage
6. 每次请求携带 Authorization: Bearer <token>
7. 后端中间件验证 token
8. 失败则返回 401/403 错误
```

#### 安全特性
- 密码 bcrypt 加密
- JWT Token 认证
- Rate Limiting (登录 5次/15分钟, API 100次/15分钟)
- Helmet 安全头
- XSS 过滤
- SQL 注入防护
- 输入验证 (express-validator)

---

### 2. 数据模型

#### 核心表结构

**users** - 用户表
- id, username, email, password (hash)
- full_name, phone, role, status
- created_at, updated_at, last_login_at

**products** - 产品表
- id, name, category, sku (唯一)
- price, dealer_price (双价格系统)
- description, status
- created_at, updated_at

**customers** - 客户表
- id, customer_type (终端/经销商)
- country, city, contact
- deal_count, created_at, updated_at

**currencies** - 货币表
- id, code, name, symbol
- exchange_rate, is_default

**cost_types** - 成本类型表
- id, code, name, category (local/ocean/related)
- is_seller_responsibility

**ports** - 港口表
- id, code, name, country, type (origin/destination)

**freight_rates** - 运费表
- id, origin_port, destination_port
- container_type (20GP/40GP/40HQ)
- price, currency, valid_from, valid_to

**audit_logs** - 审计日志
- id, user_id, action, entity_type
- entity_id, old_data, new_data
- ip_address, user_agent

**data_snapshots** - 数据快照
- id, snapshot_name, snapshot_data
- created_by, created_at

**backup_logs** - 备份日志
- id, backup_type, backup_path
- file_size, status, error_message

**system_settings** - 系统设置
- id, key, value

---

### 3. 前端架构

#### 路由结构
```javascript
/                          → 重定向到 /products
/login                     → 登录页 (公开)
/register                  → 注册页 (公开)
/products                  → 产品管理
/warehouses                → 仓库管理
/customers                 → 客户管理
/quote-generator           → 报价生成器
/freight-simulator         → 运费模拟器
/system-settings           → 系统设置
/audit-logs                → 审计日志
/backup-restore            → 备份恢复
```

#### 组件设计模式

**Apple 风格设计系统**
- 圆角设计 (rounded-2xl, rounded-[32px])
- 毛玻璃效果 (backdrop-blur-2xl)
- 渐变背景 (aurora, hero-glow)
- 浮动动画 (float animation)
- 滑入动画 (reveal animation)
- 阴影层次 (apple, float)

**组件通信**
- 父子组件: Props
- 兄弟组件: 状态提升 + Context
- API 调用: fetch + async/await
- 状态管理: useState, useEffect

#### API 客户端
```javascript
// src/lib/api.js
export const API_BASE_URL = ''
export const API_URL = `${API_BASE_URL}/api`
```

所有 API 请求通过统一的 URL 前缀访问。

---

### 4. 后端架构

#### 中间件管道
```
请求 → CORS → Helmet → Rate Limit → Body Parser → 路由 → 控制器 → 响应
```

#### 安全中间件
1. **apiLimiter**: 通用 API 限流 (100次/15分钟)
2. **authLimiter**: 认证接口限流 (5次/15分钟)
3. **authenticate**: JWT 验证中间件
4. **authorize**: 权限检查中间件
5. **sanitizeInput**: 输入清理
6. **errorHandler**: 统一错误处理

#### 控制器模式
- **auth.js**: 认证相关 (register, login, logout, refresh, changePassword)
- 所有控制器使用 async/await
- 统一错误处理格式
- 返回结构: `{ success, data/error }`

---

### 5. 数据库架构

#### 双数据库支持
**开发环境**: SQL.js (浏览器端 SQLite)
- 无服务器依赖
- 数据存储在 IndexedDB
- 适合本地开发和演示

**生产环境**: PostgreSQL 14
- 连接池管理 (pool)
- Redis 缓存
- 支持高并发

#### 数据库初始化
```javascript
// server/init-db.js
- 创建所有表结构
- 插入默认数据
- 初始化成本类型 (8种)
- 初始化港口 (10个)
- 初始化运费 (15条)
- 初始化产品 (5个)
- 初始化货币 (4种)
- 初始化用户 (3个)
```

#### 数据备份策略
- 手动备份: BackupRestore 页面
- 自动备份: node-cron 定时任务
- 备份日志: backup_logs 表
- 恢复机制: 读取备份文件恢复数据库

---

### 6. 核心业务流程

#### 产品管理流程
```
1. 用户进入产品列表页
2. 按分类筛选 (钻具类/导管类/水泵类/配件类)
3. 搜索产品 (SKU/名称)
4. 分页显示 (10条/页)
5. 点击编辑/新增
6. 填写表单 (双价格系统)
7. 提交保存
8. 更新数据库
9. 刷新列表
```

#### 报价生成流程
```
1. 选择产品 (多选)
2. 设置数量
3. 配置成本项 (可选)
4. 选择港口 (起运港/目的港)
5. 选择货币
6. 计算总价 (产品 + 成本 + 运费 + 税费)
7. 生成报价单
8. 导出 Excel (xlsx-js-style)
9. 保存到 quote_items 表
```

#### 运费模拟流程
```
1. 选择起运港 (上海/宁波/深圳/青岛)
2. 选择目的港 (洛杉矶/纽约/汉堡/鹿特丹/横滨/胡志明)
3. 选择集装箱类型 (20GP/40GP/40HQ)
4. 显示实时运费
5. 支持多条路线对比
```

---

### 7. 安全架构

#### 认证安全
- JWT Token (HS256 算法)
- 密码 bcrypt 加密 (10轮)
- Refresh Token 机制
- 会话过期自动登出

#### 数据安全
- SQL 注入防护 (参数化查询)
- XSS 防护 (helmet, xss-clean)
- 输入验证 (express-validator)
- 敏感信息脱敏

#### 传输安全
- HTTPS (生产环境)
- CORS 白名单
- 安全响应头
- HSTS (Strict-Transport-Security)

#### 权限控制
- 角色权限 (admin/sales/foreign_trade)
- 数据权限 (读/写/删除)
- 操作审计 (audit_logs)

---

### 8. 部署架构

#### Docker Compose 部署
```yaml
services:
  app:      # 应用服务 (端口 3001)
  postgres: # 数据库服务 (端口 5432)
  redis:    # 缓存服务 (端口 6379)
```

#### 构建流程
```bash
# 开发环境
npm run dev       # 前端 (5174)
npm run server    # 后端 (3001)
npm start         # 同时运行前后端

# 生产环境
npm run build     # 构建静态文件
node server.js    # 启动服务器

# Docker 部署
docker-compose up --build
```

#### 环境变量
```env
# 后端
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=price_management
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173

# 前端 (Vite)
VITE_API_BASE_URL=http://localhost:3001
```

---

### 9. 性能优化

#### 前端优化
- 代码分割 (Vite 自动)
- 懒加载 (React.lazy)
- 虚拟滚动 (大列表)
- 图片懒加载
- 缓存策略 (localStorage)

#### 后端优化
- 数据库连接池 (pool)
- Redis 缓存
- 查询优化 (索引)
- 分页查询
- 批量操作

#### 构建优化
- Tree Shaking
- 代码压缩
- CSS 压缩
- 资源优化

---

### 10. 开发规范

#### 代码风格
- ES6+ 语法
- 箭头函数
- async/await
- 模块化导入
- 命名规范 (PascalCase 组件, camelCase 变量)

#### 文件组织
- 组件按功能分类
- 样式就近原则
- 工具函数独立文件
- 常量集中管理

#### API 设计
- RESTful 风格
- 统一响应格式
- 错误码规范
- 版本控制 (/api/v1)

---

## 技术亮点

### 1. 双价格系统
支持终端价和经销商价两种定价策略,适应不同客户类型。

### 2. 成本计算器
支持 8 种成本类型:
- 打包费、陆运费、报关费、港杂费 (本地)
- 海运费、保险费 (运输相关)
- 目的港费用 (国外)

### 3. 多货币支持
- 人民币 (CNY)
- 美元 (USD)
- 欧元 (EUR)
- 越南盾 (VND)
- 实时汇率转换

### 4. 运费模拟器
- 10 个港口配置
- 15 条运费路线
- 支持 3 种集装箱类型
- 实时价格计算

### 5. 审计日志
- 记录所有关键操作
- 包含操作前后数据对比
- IP 地址和 User Agent 记录

### 6. Apple 风格 UI
- 现代化设计语言
- 毛玻璃效果
- 流畅动画
- 响应式布局

---

## 扩展性设计

### 插件化架构
- 模块化组件设计
- 可配置的路由系统
- 动态权限管理

### API 扩展
- RESTful 设计
- 统一的中间件管道
- 错误处理标准化

### 数据库扩展
- PostgreSQL 支持
- Redis 缓存层
- 连接池管理

---

## 维护指南

### 日常运维
1. 定期备份数据库
2. 查看审计日志
3. 监控服务器状态
4. 清理过期会话

### 故障排查
1. 查看服务器日志
2. 检查数据库连接
3. 验证 Redis 连接
4. 检查环境变量

### 性能监控
1. 数据库查询性能
2. API 响应时间
3. 内存使用情况
4. Redis 缓存命中率

---

## 未来改进方向

1. **微服务化**: 拆分独立服务
2. **WebSocket**: 实时通知
3. **GraphQL**: 更灵活的 API
4. **微前端**: 模块化前端
5. **CI/CD**: 自动化部署
6. **监控告警**: Prometheus + Grafana
7. **日志系统**: ELK Stack
8. **单元测试**: Jest + React Testing Library
