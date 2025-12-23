# DongYou Server

1. 复制 `env.example` 为 `.env` 并填写数据库连接
   ```bash
   cp .env.example .env
   ```
   配置项：
   - `DB_HOST` / `DB_PORT`: MySQL 地址与端口
   - `DB_USER` / `DB_PASSWORD`: 具有读写权限的账号
   - `DB_NAME`: 使用的数据库（需求为 `DongYou`）
   - `PORT`: Express 监听端口，默认 3000

2. 初始化数据库
   ```sql
   CREATE DATABASE IF NOT EXISTS DongYou DEFAULT CHARACTER SET utf8mb4;
   USE DongYou;

   CREATE TABLE IF NOT EXISTS login_info (
     id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
     phone VARCHAR(20) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     name VARCHAR(50) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ) COMMENT='登录信息表';
   ```

3. 安装依赖并启动
   ```bash
   npm install
   npm run dev
   ```

