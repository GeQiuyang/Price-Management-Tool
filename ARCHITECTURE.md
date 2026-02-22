# 价格管理系统 - 团队协作架构设计文档

> 版本：v1.0  
> 更新日期：2026-02-19  
> 文档状态：最终版

---

## 📋 目录

- [一、系统整体架构](#一系统整体架构)
- [二、用户认证和授权系统](#二用户认证和授权系统)
- [三、数据库架构设计](#三数据库架构设计)
- [四、API安全层架构](#四api安全层架构)
- [五、审计日志系统](#五审计日志系统)
- [六、数据备份和恢复方案](#六数据备份和恢复方案)
- [七、完整架构设计](#七完整架构设计)
- [八、实施路线图](#八实施路线图)
- [九、成本估算](#九成本估算)
- [十、风险评估](#十风险评估)

---

## 一、系统整体架构

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Web端   │  │  移动端  │  │  API工具  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼────────────┼────────────┼─────────────────────────────┘
        │            │            │
        └────────────┴────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CDN层                                │
│              (静态资源加速 + DDoS防护)                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    负载均衡器                              │
│              (Nginx / AWS ELB / ALB)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   应用服务器1   │  │   应用服务器2   │  │   应用服务器3   │
│  (Node.js)     │  │  (Node.js)     │  │  (Node.js)     │
└───────┬─────────┘  └───────┬─────────┘  └───────┬─────────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Redis缓存层                              │
│              (会话存储 + 热点数据)                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL主库                              │
│              (读写分离 + 事务支持)                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  PostgreSQL从库 │  │  PostgreSQL从库 │  │  PostgreSQL从库 │
│   (只读查询)    │  │   (只读查询)    │  │   (只读查询)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 1.2 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|--------|----------|------|------|
| 前端框架 | React | 18.3.1 | 组件化UI框架 |
| 构建工具 | Vite | 6.0.1 | 快速构建工具 |
| 路由 | React Router | 6.22.0 | 前端路由 |
| 后端框架 | Express.js | 4.x | Web应用框架 |
| 运行时 | Node.js | 18+ | JavaScript运行时 |
| 数据库 | PostgreSQL | 14+ | 关系型数据库 |
| 缓存 | Redis | 6+ | 内存数据库 |
| 认证 | JWT | - | JSON Web Token |
| 密码加密 | bcryptjs | - | 密码哈希 |
| 容器化 | Docker | 20+ | 容器部署 |
| 反向代理 | Nginx | 1.20+ | 负载均衡 |

### 1.3 系统特性

- ✅ 多用户并发支持
- ✅ 完善的权限管理
- ✅ 数据读写分离
- ✅ 自动备份恢复
- ✅ 审计日志追踪
- ✅ 高可用架构
- ✅ 水平扩展能力
- ✅ 实时监控告警

---

## 二、用户认证和授权系统

### 2.1 认证流程

```
┌──────────┐
│  用户    │
└────┬─────┘
     │ 1. 输入用户名/密码
     ▼
┌─────────────────────┐
│   登录API        │
│  POST /api/auth/login
└────┬──────────────┘
     │ 2. 验证凭证
     ▼
┌─────────────────────┐
│   用户服务         │
│  - 查询用户        │
│  - 验证密码        │
│  - 生成JWT Token   │
└────┬──────────────┘
     │ 3. 返回Token
     ▼
┌──────────┐
│  客户端  │
└────┬─────┘
     │ 4. 存储Token
     ▼
┌─────────────────────┐
│  LocalStorage     │
└────┬──────────────┘
     │ 5. 携带Token请求
     ▼
┌─────────────────────┐
│   API网关         │
│  - 验证Token      │
│  - 检查权限       │
└────┬──────────────┘
     │ 6. 通过验证
     ▼
┌─────────────────────┐
│   业务逻辑         │
└─────────────────────┘
```

### 2.2 数据库设计

#### 用户表

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  role_id INTEGER REFERENCES roles(id),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role_id);
```

#### 角色表

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色预设
INSERT INTO roles (name, display_name, description, permissions) VALUES
('admin', '管理员', '拥有所有权限', '["*"]'::jsonb),
('manager', '经理', '可以管理产品和报价', '["products:*", "quotes:*", "customers:*"]'::jsonb),
('editor', '编辑', '可以编辑产品和报价', '["products:read", "products:write", "quotes:read", "quotes:write"]'::jsonb),
('viewer', '查看者', '只能查看数据', '["products:read", "quotes:read", "customers:read"]'::jsonb);
```

#### 会话表

```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token VARCHAR(500) UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

#### 登录日志表

```sql
CREATE TABLE login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_status VARCHAR(20) NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_logs_user ON login_logs(user_id);
CREATE INDEX idx_login_logs_status ON login_logs(login_status);
CREATE INDEX idx_login_logs_timestamp ON login_logs(created_at DESC);
```

#### 密码重置表

```sql
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user ON password_resets(user_id);
```

### 2.3 API设计

#### 认证相关API

| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|--------|------|--------|--------|
| POST | /api/auth/register | 用户注册 | 否 | - |
| POST | /api/auth/login | 用户登录 | 否 | - |
| POST | /api/auth/refresh | 刷新令牌 | 否 | - |
| POST | /api/auth/logout | 用户登出 | 是 | - |
| GET | /api/auth/me | 获取当前用户 | 是 | - |
| POST | /api/auth/change-password | 修改密码 | 是 | - |
| POST | /api/auth/forgot-password | 请求密码重置 | 否 | - |
| POST | /api/auth/reset-password | 重置密码 | 否 | - |

#### API响应示例

**登录成功响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "管理员",
      "role": {
        "id": 1,
        "name": "admin",
        "display_name": "管理员",
        "permissions": ["*"]
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用户名或密码错误"
  }
}
```

---

## 三、数据库架构设计

### 3.1 核心业务表

#### 产品表

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (sku)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_by ON products(created_by);
```

#### 客户表

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_type VARCHAR(50) NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  contact TEXT,
  deal_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_country ON customers(country);
```

#### 货币表

```sql
CREATE TABLE currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  exchange_rate DECIMAL(10, 4) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 成本表

```sql
CREATE TABLE costs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  cost_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_costs_product ON costs(product_id);
CREATE INDEX idx_costs_type ON costs(cost_type);
```

### 3.2 报价系统表

#### 报价单表

```sql
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  total_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'CNY',
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_by ON quotes(created_by);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
```

#### 报价项表

```sql
CREATE TABLE quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON quote_items(product_id);
```

### 3.3 团队协作表

#### 团队表

```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_owner ON teams(owner_id);
```

#### 团队成员表

```sql
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

#### 团队资源表

```sql
CREATE TABLE team_resources (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER NOT NULL,
  permission_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (team_id, resource_type, resource_id)
);

CREATE INDEX idx_team_resources_team ON team_resources(team_id);
```

#### 数据权限表

```sql
CREATE TABLE data_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER NOT NULL,
  permission_level VARCHAR(20) NOT NULL,
  granted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, resource_type, resource_id)
);

CREATE INDEX idx_data_permissions_user ON data_permissions(user_id);
CREATE INDEX idx_data_permissions_resource ON data_permissions(resource_type, resource_id);
```

### 3.4 数据库配置

#### 连接池配置

```javascript
const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

#### 事务示例

```javascript
async function createQuoteWithItems(quoteData, items) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const quoteResult = await client.query(
      'INSERT INTO quotes (quote_number, customer_id, total_amount, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [quoteData.quoteNumber, quoteData.customerId, quoteData.totalAmount, quoteData.createdBy]
    )
    
    const quoteId = quoteResult.rows[0].id
    
    const itemPromises = items.map(item => 
      client.query(
        'INSERT INTO quote_items (quote_id, product_id, sku, name, price, quantity, subtotal, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [quoteId, item.productId, item.sku, item.name, item.price, item.quantity, item.subtotal, quoteData.createdBy]
      )
    )
    
    await Promise.all(itemPromises)
    await client.query('COMMIT')
    
    return quoteResult.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
```

---

## 四、API安全层架构

### 4.1 中间件设计

#### 认证中间件

```javascript
const jwt = require('jsonwebtoken')

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    
    const session = await pool.query(
      'SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    )
    
    if (!session.rows[0]) {
      return res.status(401).json({ error: '会话已过期' })
    }
    
    next()
  } catch (error) {
    return res.status(403).json({ error: '无效的认证令牌' })
  }
}
```

#### 授权中间件

```javascript
exports.authorize = (requiredPermissions) => {
  return async (req, res, next) => {
    const user = req.user
    
    if (user.role === 'admin') {
      return next()
    }
    
    const userRole = await pool.query(
      'SELECT permissions FROM roles WHERE id = $1',
      [user.role_id]
    )
    
    const permissions = userRole.rows[0]?.permissions || []
    const hasPermission = requiredPermissions.every(perm => 
      permissions.includes(perm) || permissions.includes('*')
    )
    
    if (!hasPermission) {
      return res.status(403).json({ error: '权限不足' })
    }
    
    next()
  }
}
```

#### 数据权限中间件

```javascript
exports.checkDataPermission = (resourceType, requiredLevel) => {
  return async (req, res, next) => {
    const user = req.user
    const resourceId = req.params.id || req.body.id
    
    if (user.role === 'admin') {
      return next()
    }
    
    const permission = await pool.query(
      `SELECT permission_level FROM data_permissions 
       WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3`,
      [user.id, resourceType, resourceId]
    )
    
    const levels = { read: 1, write: 2, delete: 3 }
    const currentLevel = permission.rows[0]?.permission_level
    
    if (!currentLevel || levels[currentLevel] < levels[requiredLevel]) {
      return res.status(403).json({ error: '无权访问此数据' })
    }
    
    next()
  }
}
```

#### 速率限制中间件

```javascript
const rateLimit = require('express-rate-limit')

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
})

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: '登录尝试过多，请15分钟后再试'
})
```

### 4.2 安全配置

```javascript
const helmet = require('helmet')
const cors = require('cors')

module.exports = function(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
  }))
  
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))
  
  app.disable('x-powered-by')
}
```

### 4.3 API路由保护

```javascript
const express = require('express')
const router = express.Router()
const { authenticate, authorize, checkDataPermission } = require('../middleware/auth')
const { apiLimiter, authLimiter } = require('../middleware/auth')

router.post('/auth/login', authLimiter, require('./auth').login)
router.post('/auth/register', authLimiter, require('./auth').register)
router.post('/auth/forgot-password', authLimiter, require('./auth').forgotPassword)

router.use(authenticate)

router.get('/users', authorize(['users:read']), require('./users').list)
router.post('/users', authorize(['users:create']), require('./users').create)
router.put('/users/:id', authorize(['users:update']), require('./users').update)
router.delete('/users/:id', authorize(['users:delete']), require('./users').delete)

router.get('/products', authorize(['products:read']), require('./products').list)
router.post('/products', authorize(['products:create']), require('./products').create)
router.put('/products/:id', 
  authorize(['products:update']),
  checkDataPermission('products', 'write'),
  require('./products').update
)
router.delete('/products/:id',
  authorize(['products:delete']),
  checkDataPermission('products', 'delete'),
  require('./products').delete
)

module.exports = router
```

---

## 五、审计日志系统

### 5.1 审计日志表

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  resource_name VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at DESC);
```

### 5.2 数据快照表

```sql
CREATE TABLE data_snapshots (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (resource_type, resource_id, version)
);

CREATE INDEX idx_snapshots_resource ON data_snapshots(resource_type, resource_id);
```

### 5.3 操作历史表

```sql
CREATE TABLE operation_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  operation_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operation_history_user ON operation_history(user_id);
CREATE INDEX idx_operation_history_type ON operation_history(operation_type);
```

### 5.4 审计中间件

```javascript
const { performance } = require('perf_hooks')

exports.auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    const startTime = performance.now()
    const originalSend = res.send
    
    res.send = function(data) {
      const duration = Math.round(performance.now() - startTime)
      const user = req.user
      
      if (user) {
        pool.query(
          `INSERT INTO operation_history 
           (user_id, operation_type, description, metadata, duration_ms)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            user.id,
            `${action}_${resourceType}`,
            `${action} ${resourceType}`,
            JSON.stringify({
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
            }),
            duration
          ]
        )
      }
      
      const sensitiveActions = ['create', 'update', 'delete', 'export', 'import']
      if (sensitiveActions.includes(action)) {
        pool.query(
          `INSERT INTO audit_logs 
           (user_id, action, resource_type, resource_id, resource_name, changes, ip_address, user_agent, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            user?.id,
            action,
            resourceType,
            req.params.id || req.body?.id,
            req.body?.name || req.body?.title || '',
            JSON.stringify({
              before: req.originalData,
              after: req.body,
            }),
            req.ip,
            req.get('user-agent'),
            res.statusCode < 400 ? 'success' : 'failed'
          ]
        )
      }
      
      originalSend.call(this, data)
    }
    
    next()
  }
}
```

---

## 六、数据备份和恢复方案

### 6.1 备份策略

#### 全量备份

```javascript
async function fullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `full-backup-${timestamp}.sql`
  const filepath = path.join(BACKUP_DIR, filename)
  
  try {
    console.log(`开始全量备份: ${timestamp}`)
    
    const command = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -F c -f ${filepath}`
    
    await new Promise((resolve, reject) => {
      exec(command, { env: { PGPASSWORD: process.env.DB_PASSWORD } }, (error, stdout, stderr) => {
        if (error) {
          console.error('备份失败:', error)
          reject(error)
        } else {
          console.log('备份成功:', filename)
          resolve(filename)
        }
      })
    })
    
    await pool.query(
      `INSERT INTO backup_logs (type, filename, size, status, created_at)
       VALUES ('full', $1, $2, 'success', NOW())`,
      [filename, fs.statSync(filepath).size]
    )
    
    return filename
  } catch (error) {
    await pool.query(
      `INSERT INTO backup_logs (type, filename, status, error_message, created_at)
       VALUES ('full', $1, 'failed', $2, NOW())`,
      [filename, error.message]
    )
    throw error
  }
}
```

#### 增量备份

```javascript
async function incrementalBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `incremental-backup-${timestamp}.wal`
  const filepath = path.join(BACKUP_DIR, filename)
  
  try {
    console.log(`开始增量备份: ${timestamp}`)
    
    await pool.query('SELECT pg_switch_wal()')
    
    const walDir = path.join(BACKUP_DIR, 'wal')
    if (!fs.existsSync(walDir)) {
      fs.mkdirSync(walDir, { recursive: true })
    }
    
    await pool.query(
      `INSERT INTO backup_logs (type, filename, status, created_at)
       VALUES ('incremental', $1, 'success', NOW())`,
      [filename]
    )
    
    console.log('增量备份成功:', filename)
    return filename
  } catch (error) {
    await pool.query(
      `INSERT INTO backup_logs (type, filename, status, error_message, created_at)
       VALUES ('incremental', $1, 'failed', $2, NOW())`,
      [filename, error.message]
    )
    throw error
  }
}
```

#### 云端备份

```javascript
async function cloudBackup(localFile) {
  const OSS = require('ali-oss')
  const client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
  })
  
  try {
    const filepath = path.join(BACKUP_DIR, localFile)
    const result = await client.put(
      `backups/${localFile}`,
      filepath
    )
    
    console.log('云端备份成功:', result.name)
    
    await pool.query(
      `UPDATE backup_logs SET cloud_url = $1, cloud_uploaded_at = NOW()
       WHERE filename = $2`,
      [result.url, localFile]
    )
    
    return result.url
  } catch (error) {
    console.error('云端备份失败:', error)
    throw error
  }
}
```

### 6.2 恢复方案

#### 从备份文件恢复

```javascript
async function restoreFromBackup(backupFile) {
  const filepath = path.join(BACKUP_DIR, backupFile)
  
  if (!fs.existsSync(filepath)) {
    throw new Error('备份文件不存在')
  }
  
  try {
    console.log(`开始恢复: ${backupFile}`)
    
    await pool.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1', [process.env.DB_NAME])
    
    await new Promise((resolve, reject) => {
      exec(`dropdb -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ${process.env.DB_NAME}`, 
        { env: { PGPASSWORD: process.env.DB_PASSWORD } },
        (error, stdout, stderr) => {
          if (error && !stderr.includes('does not exist')) {
            reject(error)
          } else {
            resolve()
          }
        }
      )
    })
    
    await new Promise((resolve, reject) => {
      exec(`createdb -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ${process.env.DB_NAME}`, 
        { env: { PGPASSWORD: process.env.DB_PASSWORD } },
        (error, stdout, stderr) => {
          if (error) reject(error)
          else resolve()
        }
      )
    })
    
    await new Promise((resolve, reject) => {
      const command = `pg_restore -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -F c ${filepath}`
      exec(command, { env: { PGPASSWORD: process.env.DB_PASSWORD } }, (error, stdout, stderr) => {
        if (error) {
          console.error('恢复失败:', error)
          reject(error)
        } else {
          console.log('恢复成功')
          resolve()
        }
      })
    })
    
    await pool.query(
      `INSERT INTO restore_logs (backup_file, status, created_at)
       VALUES ($1, 'success', NOW())`,
      [backupFile]
    )
    
    console.log('恢复完成')
  } catch (error) {
    await pool.query(
      `INSERT INTO restore_logs (backup_file, status, error_message, created_at)
       VALUES ($1, 'failed', $2, NOW())`,
      [backupFile, error.message]
    )
    throw error
  }
}
```

### 6.3 备份日志表

```sql
CREATE TABLE backup_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  size BIGINT,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  cloud_url VARCHAR(500),
  cloud_uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE restore_logs (
  id SERIAL PRIMARY KEY,
  backup_file VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  restored_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.4 自动备份调度

```javascript
const cron = require('node-cron')

function scheduleBackups() {
  cron.schedule('0 2 * * *', async () => {
    try {
      const backupFile = await fullBackup()
      await cloudBackup(backupFile)
      await cleanupOldBackups()
    } catch (error) {
      console.error('自动备份失败:', error)
    }
  })
  
  cron.schedule('0 */4 * * *', async () => {
    try {
      await incrementalBackup()
    } catch (error) {
      console.error('增量备份失败:', error)
    }
  })
  
  console.log('备份调度已启动')
}
```

---

## 七、完整架构设计

### 7.1 功能模块

```
┌─────────────────────────────────────────────────────────────────────┐
│                      功能模块架构                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  用户管理    │  │  产品管理    │  │  客户管理    │  │
│  │  - 注册登录  │  │  - CRUD操作  │  │  - CRUD操作  │  │
│  │  - 角色权限  │  │  - 分类管理  │  │  - 联系人   │  │
│  │  - 会话管理  │  │  - SKU管理   │  │  - 交易记录  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  报价管理    │  │  成本管理    │  │  货币管理    │  │
│  │  - 创建报价  │  │  - 成本录入  │  │  - 汇率管理  │  │
│  │  - 导出Excel │  │  - 成本分析  │  │  - 默认货币  │  │
│  │  - 版本控制  │  │  - 报表统计  │  │  - 历史记录  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  团队协作    │  │  审计日志    │  │  系统设置    │  │
│  │  - 团队管理  │  │  - 操作记录  │  │  - 参数配置  │  │
│  │  - 权限分配  │  │  - 数据追踪  │  │  - 备份恢复  │  │
│  │  - 数据共享  │  │  - 快照恢复  │  │  - 通知设置  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 安全架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                      安全防护体系                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                              │
│  第1层：网络安全                                              │
│  ├─ HTTPS/TLS 1.3                                          │
│  ├─ DDoS防护（Cloudflare/阿里云DDoS）                       │
│  ├─ WAF防火墙（SQL注入、XSS、CSRF防护）                      │
│  └─ IP白名单/黑名单                                          │
│                                                              │
│  第2层：应用安全                                              │
│  ├─ JWT认证（Access Token + Refresh Token）                     │
│  ├─ 密码加密（bcrypt，10轮加盐）                             │
│  ├─ 输入验证（express-validator）                              │
│  ├─ XSS防护（xss-clean）                                     │
│  ├─ SQL注入防护（参数化查询）                                │
│  └─ CSRF防护（SameSite Cookie + CSRF Token）                    │
│                                                              │
│  第3层：数据安全                                              │
│  ├─ 数据库加密（TDE透明数据加密）                            │
│  ├─ 敏感字段加密（AES-256）                                │
│  ├─ 数据脱敏（手机号、邮箱部分隐藏）                          │
│  ├─ 访问控制（RBAC + ABAC）                                 │
│  └─ 审计日志（所有操作记录）                                 │
│                                                              │
│  第4层：运维安全                                              │
│  ├─ 定期备份（全量+增量）                                   │
│  ├─ 异地备份（OSS对象存储）                                   │
│  ├─ 灾难恢复（RTO < 1小时，RPO < 15分钟）                  │
│  ├─ 安全监控（异常登录、异常操作告警）                           │
│  └─ 漏洞扫描（定期安全扫描）                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 部署架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                    生产环境部署架构                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  CDN层                            │    │
│  │          (静态资源 + DDoS防护)                      │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                        │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │               负载均衡器 (Nginx)               │    │
│  │          SSL终止 + 反向代理                          │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                        │
│          ┌──────────────┼──────────────┐                    │
│          ▼              ▼              ▼                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │  应用服务器1│  │  应用服务器2│  │  应用服务器3│          │
│  │  Docker   │  │  Docker   │  │  Docker   │          │
│  │  Node.js  │  │  Node.js  │  │  Node.js  │          │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘          │
│        │                │                │                      │
│        └────────────────┴────────────────┘                      │
│                       │                                        │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │                  PostgreSQL主库                   │    │
│  │              (读写分离 + 流复制)                       │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                        │
│          ┌──────────────┼──────────────┐                    │
│          ▼              ▼              ▼                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │PostgreSQL从库│  │PostgreSQL从库│  │PostgreSQL从库│          │
│  │  (只读查询) │  │  (只读查询) │  │  (只读查询) │          │
│  └───────────┘  └───────────┘  └───────────┘          │
│                                                              │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │                    Redis缓存                      │    │
│  │              (会话 + 热点数据)                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │                  对象存储 (OSS)                     │    │
│  │              (备份文件 + 静态资源)                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │                监控告警系统                  │    │
│  │      (Prometheus + Grafana + AlertManager)            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.4 性能优化

#### 缓存策略

```javascript
const redis = require('redis')
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
})

const cacheStrategies = {
  userSession: {
    ttl: 86400,
    key: (userId) => `session:${userId}`,
  },
  productList: {
    ttl: 3600,
    key: (category) => `products:${category}`,
  },
  quoteData: {
    ttl: 1800,
    key: (quoteId) => `quote:${quoteId}`,
  },
  userPermissions: {
    ttl: 7200,
    key: (userId) => `permissions:${userId}`,
  },
}
```

### 7.5 监控指标

```javascript
const promClient = require('prom-client')

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP请求耗时',
  labelNames: ['method', 'route', 'status_code'],
})

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'HTTP请求总数',
  labelNames: ['method', 'route', 'status_code'],
})

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: '数据库查询耗时',
  labelNames: ['operation', 'table'],
})

const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: '活跃用户数',
})
```

---

## 八、实施路线图

### 阶段一：基础安全（2-3周）

**Week 1-2:**
- ✅ 实现用户认证系统
- ✅ 添加JWT令牌管理
- ✅ 配置HTTPS
- ✅ 实现基础权限控制

**Week 3:**
- ✅ 添加输入验证
- ✅ 实现SQL注入防护
- ✅ 配置CORS
- ✅ 添加速率限制

### 阶段二：数据库迁移（3-4周）

**Week 1-2:**
- ✅ 设计PostgreSQL数据库结构
- ✅ 创建数据库迁移脚本
- ✅ 测试数据迁移
- ✅ 配置连接池

**Week 3-4:**
- ✅ 迁移所有业务数据
- ✅ 实现读写分离
- ✅ 配置Redis缓存
- ✅ 性能测试和优化

### 阶段三：团队协作功能（2-3周）

**Week 1-2:**
- ✅ 实现团队管理
- ✅ 添加数据权限控制
- ✅ 实现数据共享功能
- ✅ 添加审计日志系统

**Week 3:**
- ✅ 实现数据快照
- ✅ 添加版本控制
- ✅ 实现权限继承
- ✅ 测试协作功能

### 阶段四：备份恢复（1-2周）

**Week 1:**
- ✅ 实现自动备份
- ✅ 配置云端存储
- ✅ 添加备份调度
- ✅ 实现恢复功能

**Week 2:**
- ✅ 实现时间点恢复
- ✅ 添加备份监控
- ✅ 测试恢复流程
- ✅ 编写恢复文档

### 阶段五：监控告警（1-2周）

**Week 1:**
- ✅ 集成Prometheus
- ✅ 配置Grafana仪表板
- ✅ 添加业务指标
- ✅ 配置告警规则

**Week 2:**
- ✅ 配置通知渠道
- ✅ 测试告警流程
- ✅ 优化监控指标
- ✅ 编写运维文档

---

## 九、成本估算

### 9.1 基础设施成本（月）

| 项目 | 配置 | 价格（月） |
|------|--------|-----------|
| 云服务器（3台2核4G） | 2核4G × 3 | ¥600-900 |
| PostgreSQL云数据库 | 主库+2从库 | ¥500-800 |
| Redis缓存 | 2G | ¥200-300 |
| 对象存储（1TB） | OSS标准存储 | ¥150-250 |
| CDN加速 | 国内流量 | ¥100-200 |
| 域名+SSL证书 | .com + Let's Encrypt | ¥20-50/年 |
| 监控告警 | Prometheus + Grafana | ¥100-200 |
| **月度总计** | | **¥1,670-2,650** |
| **年度总计** | | **¥20,040-31,800** |

### 9.2 人力成本（月）

| 角色 | 人数 | 月薪 | 小计 |
|------|------|-------|------|
| 后端开发 | 1人 | ¥15,000-25,000 | ¥15,000-25,000 |
| 前端开发 | 1人 | ¥15,000-25,000 | ¥15,000-25,000 |
| 运维工程师 | 0.5人 | ¥16,000-24,000 | ¥8,000-12,000 |
| 测试工程师 | 0.5人 | ¥12,000-20,000 | ¥6,000-10,000 |
| **月度总计** | | | **¥44,000-72,000** |
| **年度总计** | | | **¥528,000-864,000** |

### 9.3 总成本汇总

| 阶段 | 月度成本 | 年度成本 |
|--------|---------|---------|
| 基础设施 | ¥1,670-2,650 | ¥20,040-31,800 |
| 人力成本 | ¥44,000-72,000 | ¥528,000-864,000 |
| **总计** | **¥45,670-74,650** | **¥548,040-895,800** |

---

## 十、风险评估

### 10.1 技术风险

| 风险项 | 概率 | 影响 | 应对措施 |
|---------|--------|--------|----------|
| 数据迁移失败 | 中 | 高 | 充分测试，保留回退方案 |
| 性能不达标 | 中 | 中 | 提前压测，优化查询 |
| 安全漏洞 | 低 | 高 | 定期扫描，及时修复 |
| 并发冲突 | 中 | 中 | 读写分离，优化锁机制 |

### 10.2 业务风险

| 风险项 | 概率 | 影响 | 应对措施 |
|---------|--------|--------|----------|
| 用户接受度低 | 中 | 高 | 提前培训，收集反馈 |
| 数据丢失 | 低 | 高 | 多重备份，异地存储 |
| 系统宕机 | 中 | 高 | 高可用架构，自动切换 |
| 合规问题 | 低 | 高 | 遵循法规，定期审计 |

### 10.3 风险缓解策略

#### 数据安全
- 实施多层加密
- 定期安全审计
- 建立应急响应机制

#### 业务连续性
- 建立灾备中心
- 制定应急预案
- 定期演练恢复流程

#### 合规管理
- 遵循数据保护法规
- 定期合规审计
- 建立合规文档体系

---

## 附录

### A. 环境变量配置

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=price_management
DB_USER=postgres
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret_key
OSS_BUCKET=your-bucket-name

# CORS配置
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### B. Docker配置示例

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=price_management
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### C. Nginx配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://app:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /app/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 文档变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|--------|--------|----------|------|
| v1.0 | 2026-02-19 | 初始版本，完整架构设计 | AI Assistant |

---

**文档结束**
