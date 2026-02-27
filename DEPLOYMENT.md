# 项目本地部署指南

## 环境要求

- **Git** — 版本管理工具
- **Node.js** v18+ — JavaScript 运行环境（自带 npm）

---

## 1. 安装 Git

### Mac

Mac 通常自带 Git，打开终端验证：

```bash
git --version
```

如果未安装，执行以下命令会自动弹窗安装：

```bash
xcode-select --install
```

### Windows

前往 [https://git-scm.com/download/win](https://git-scm.com/download/win) 下载安装包，一路默认选项安装即可。

---

## 2. 安装 Node.js

前往 [https://nodejs.org](https://nodejs.org) 下载 **LTS（长期支持）版本**：

- **Mac** — 下载 `.pkg` 文件，双击安装
- **Windows** — 下载 `.msi` 文件，双击安装

安装完成后验证：

```bash
node --version   # 应输出 v18.x.x 或更高
npm --version    # 应输出 10.x.x 或更高
```

---

## 3. 克隆项目

```bash
git clone https://github.com/GeQiuyang/Price-Management-Tool.git
cd Price-Management-Tool
```

---

## 4. 安装依赖

```bash
npm install
```

---

## 5. 启动项目

```bash
npm run start
```

该命令会同时启动：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 (Vite) | http://localhost:5173 | React 前端页面 |
| 后端 (Express) | http://localhost:3001 | API 服务 |

启动成功后，在浏览器中打开 `http://localhost:5173` 即可使用。

> **提示**：也可以使用 `bash start.sh` 启动，它会自动释放被占用的端口。

---

## 常见问题

### 端口被占用

如果提示端口 3001 或 5173 已被占用：

```bash
# Mac / Linux
lsof -ti :3001 | xargs kill -9
lsof -ti :5173 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID号> /F
```

### npm install 报错

尝试清除缓存后重新安装：

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 线上部署指南 (Production Deployment)

本指南适用于在云服务器（如阿里云、腾讯云、AWS等）上进行生产级部署。

### 1. 架构推荐

- **前端层**: Nginx (反向代理 + 静态资源直接托管) 或使用 Vercel / Netlify。
- **后端层**: Node.js + PM2 (进程守护)。
- **数据层**: 本地 SQLite，或迁移至 PostgreSQL + Redis (按需启用)。

### 2. 前端静态部署 (推荐 Nginx)

1. **打包编译**:
   在开发机或 CI/CD 流水线上执行：
   ```bash
   npm install
   npm run build
   ```
   这将在根目录下生成 `dist/` 文件夹。

2. **配置 Nginx**:
   将 `dist/` 目录上传到服务器指定的静态资源目录（例如 `/var/www/price-management-tool/dist`）。
   修改 Nginx 配置文件（如 `/etc/nginx/conf.d/price-tool.conf`）：
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com; # 替换为实际域名或服务器公网 IP

       # 前端静态页面托管
       location / {
           root /var/www/price-management-tool/dist;
           index index.html;
           try_files $uri $uri/ /index.html; # 适配 React Router 单页应用
       }

       # API 反向代理到后端服务
       location /api/ {
           proxy_pass http://127.0.0.1:3001/; 
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
3. 测试配置并重启 Nginx：
   ```bash
   nginx -t
   nginx -s reload
   ```

### 3. 后端服务部署 (推荐 PM2)

项目中包含一个 Express 后端 API (端口默认为 3001)，需要使其在服务器后台常驻运行脱离控制台生命周期。

1. **环境与依赖**:
   在服务器上安装 Node.js，然后上传后端需要的代码（通常是提交 Git 并在服务器端拉取）。
   ```bash
   cd Price-Management-Tool
   npm install --production
   ```

2. **安装并启动 PM2**:
   ```bash
   # 全局安装 pm2
   npm install -g pm2
   
   # 启动后端服务
   pm2 start npm --name "price-api" -- run server
   
   # （如果启动命令是单纯的 node 脚本，也可以直接 pm2 start server/server.js --name "price-api"）
   ```

3. **常用 PM2 命令**:
   ```bash
   pm2 logs price-api       # 查看运行日志
   pm2 restart price-api    # 重启服务
   pm2 startup              # 设置开机自启 (需按终端提示执行对应命令)
   pm2 save                 # 保存当前 PM2 进程列表，以便开机自启
   ```

### 4. 生产环境变量配置

请确保在生产环境服务器项目根目录中，创建 `.env` 文件，配置真实且安全的生产环境凭证，尤其是数据库信息和身份验证密钥：
```env
# 服务端口
PORT=3001
# 数据库类型设定
DB_TYPE=sqlite
# 你的加密密钥(务必替换为高强度的随机字符串)
JWT_SECRET=your_production_secure_secret_key
```

### 5. Docker 容器化部署（替代方案）

如果你的团队或服务器偏导向容器运维，可以利用 Docker：
撰写 `Dockerfile` 使用多阶段构建：
- 构建层（Node 环境执行 `npm run build`）
- 运行层（拷贝 `dist/` 送入 Nginx 镜像，或通过 Nginx + Node 后端协同镜像）。如果采用 `docker-compose` 来编排将更加清晰，可以一次性拉起前端、后端容器与数据库容器。
