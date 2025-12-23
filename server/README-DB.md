# 数据库初始化说明

## 数据库表结构

本项目使用 MySQL 数据库，包含以下表：

1. **login_info** - 用户登录信息表
2. **posts** - 帖子表（包含点赞数和评论数字段）
3. **comments** - 评论表
4. **post_likes** - 点赞表

## 初始化方法

### 方法一：使用初始化脚本（推荐）

```bash
cd server
npm run init-db
```

### 方法二：使用 API 端点

启动服务器后，访问：
```bash
POST http://localhost:3000/api/admin/init-db
```

### 方法三：自动初始化

服务器启动时会自动检查并创建/更新表结构。

## 表结构说明

### posts 表
- `likes_count` - 点赞数（自动从 post_likes 表统计）
- `comments_count` - 评论数（自动从 comments 表统计）

### comments 表
- 存储帖子的所有评论
- 包含用户信息和评论内容

### post_likes 表
- 存储用户的点赞记录
- 使用唯一索引防止重复点赞

## 注意事项

1. 初始化脚本会自动检查字段是否存在，不会重复添加
2. 已有帖子的统计数据会自动同步
3. 点赞和评论操作会自动更新统计数字段

