/**
 * 数据库初始化脚本
 * 用于重新初始化数据库表结构
 * 
 * 使用方法：
 * node init-db.js
 */

import pool from './db.js'
import dotenv from 'dotenv'

dotenv.config()

// 检查字段是否存在
async function columnExists(tableName, columnName) {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
      [tableName, columnName]
    )
    return rows[0].count > 0
  } catch (error) {
    return false
  }
}

// 初始化用户表
async function initUserTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_info (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
        phone VARCHAR(20) NOT NULL COMMENT '手机号',
        password VARCHAR(255) NOT NULL COMMENT '密码',
        name VARCHAR(50) NOT NULL COMMENT '姓名/昵称',
        avatar VARCHAR(500) DEFAULT '' COMMENT '用户头像',
        gender VARCHAR(10) DEFAULT '' COMMENT '性别：male/female/other',
        bio VARCHAR(200) DEFAULT '' COMMENT '个性签名',
        background_image VARCHAR(500) DEFAULT '' COMMENT '背景图片',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id),
        UNIQUE KEY uniq_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录用户表';
    `)
    
    // 检查并添加字段
    if (!(await columnExists('login_info', 'avatar'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN avatar VARCHAR(500) DEFAULT '' COMMENT '用户头像'`)
      console.log('  ✓ 添加 avatar 字段')
    }
    
    if (!(await columnExists('login_info', 'gender'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN gender VARCHAR(10) DEFAULT '' COMMENT '性别：male/female/other'`)
      console.log('  ✓ 添加 gender 字段')
    }
    
    if (!(await columnExists('login_info', 'bio'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN bio VARCHAR(200) DEFAULT '' COMMENT '个性签名'`)
      console.log('  ✓ 添加 bio 字段')
    }
    
    if (!(await columnExists('login_info', 'background_image'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN background_image VARCHAR(500) DEFAULT '' COMMENT '背景图片'`)
      console.log('  ✓ 添加 background_image 字段')
    }
    
    if (!(await columnExists('login_info', 'updated_at'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'`)
      console.log('  ✓ 添加 updated_at 字段')
    }
    
    console.log('✓ login_info 表初始化成功')
  } catch (error) {
    console.error('✗ login_info 表初始化失败:', error.message)
    throw error
  }
}

// 初始化帖子表
async function initPostsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
        title VARCHAR(200) NOT NULL COMMENT '标题',
        content TEXT NOT NULL COMMENT '详细内容',
        images JSON COMMENT '图片URL数组',
        author_id INT UNSIGNED NOT NULL COMMENT '作者ID',
        author_name VARCHAR(50) NOT NULL COMMENT '作者名称',
        author_avatar VARCHAR(500) DEFAULT '' COMMENT '作者头像',
        likes_count INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
        comments_count INT UNSIGNED DEFAULT 0 COMMENT '评论数',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_author (author_id),
        KEY idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子表';
    `)
    
    // 检查并添加字段
    if (!(await columnExists('posts', 'likes_count'))) {
      await pool.query(`ALTER TABLE posts ADD COLUMN likes_count INT UNSIGNED DEFAULT 0 COMMENT '点赞数'`)
      console.log('  ✓ 添加 likes_count 字段')
    }
    
    if (!(await columnExists('posts', 'comments_count'))) {
      await pool.query(`ALTER TABLE posts ADD COLUMN comments_count INT UNSIGNED DEFAULT 0 COMMENT '评论数'`)
      console.log('  ✓ 添加 comments_count 字段')
    }
    
    // 更新已有帖子的统计数据
    await pool.query(`
      UPDATE posts p
      SET p.likes_count = COALESCE((
        SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id
      ), 0),
      p.comments_count = COALESCE((
        SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id
      ), 0)
    `)
    
    console.log('✓ posts 表初始化成功')
  } catch (error) {
    console.error('✗ posts 表初始化失败:', error.message)
    throw error
  }
}

// 初始化评论表
async function initCommentsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
        post_id INT UNSIGNED NOT NULL COMMENT '帖子ID',
        user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
        user_name VARCHAR(50) NOT NULL COMMENT '用户名称',
        user_avatar VARCHAR(500) DEFAULT '' COMMENT '用户头像',
        content TEXT NOT NULL COMMENT '评论内容',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (id),
        KEY idx_post (post_id),
        KEY idx_user (user_id),
        KEY idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';
    `)
    console.log('✓ comments 表初始化成功')
  } catch (error) {
    console.error('✗ comments 表初始化失败:', error.message)
    throw error
  }
}

// 初始化点赞表
async function initLikesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
        post_id INT UNSIGNED NOT NULL COMMENT '帖子ID',
        user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY uniq_post_user (post_id, user_id),
        KEY idx_post (post_id),
        KEY idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表';
    `)
    console.log('✓ post_likes 表初始化成功')
  } catch (error) {
    console.error('✗ post_likes 表初始化失败:', error.message)
    throw error
  }
}

// 主函数
async function main() {
  console.log('开始初始化数据库...\n')
  
  try {
    // 测试数据库连接
    await pool.query('SELECT 1')
    console.log('✓ 数据库连接成功\n')
    
    // 初始化所有表
    await initUserTable()
    await initPostsTable()
    await initCommentsTable()
    await initLikesTable()
    
    console.log('\n✓ 数据库初始化完成！')
    process.exit(0)
  } catch (error) {
    console.error('\n✗ 数据库初始化失败:', error.message)
    process.exit(1)
  }
}

// 运行初始化
main()

