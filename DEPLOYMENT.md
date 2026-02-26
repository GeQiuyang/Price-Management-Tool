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
