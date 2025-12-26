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

// 初始化商品表
async function initProductsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
        name VARCHAR(200) NOT NULL COMMENT '商品名称',
        description TEXT COMMENT '商品描述',
        image VARCHAR(500) DEFAULT '' COMMENT '商品图片URL',
        category ENUM('hotel', 'restaurant', 'ticket') NOT NULL COMMENT '商品分类：hotel-酒店, restaurant-食宿, ticket-门票',
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '价格',
        original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '原价（用于显示折扣）',
        location VARCHAR(200) DEFAULT '' COMMENT '位置/地址',
        rating DECIMAL(3, 1) DEFAULT 0.0 COMMENT '评分（0-5分）',
        sales_count INT UNSIGNED DEFAULT 0 COMMENT '销量',
        stock INT UNSIGNED DEFAULT 0 COMMENT '库存',
        tags JSON COMMENT '标签数组',
        details JSON COMMENT '详细信息（JSON格式）',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY idx_category (category),
        KEY idx_created (created_at),
        KEY idx_rating (rating),
        KEY idx_sales (sales_count)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';
    `)
    console.log('✓ products 表初始化成功')
    
    // 插入示例数据
    const [existingProducts] = await pool.query('SELECT COUNT(*) as count FROM products')
    if (existingProducts[0].count === 0) {
      await pool.query(`
        INSERT INTO products (name, description, image, category, price, original_price, location, rating, sales_count, stock, tags, details) VALUES
        ('樱花温泉酒店', '位于山脚下的日式温泉酒店，环境优雅，服务周到。提供传统日式早餐和温泉浴场。', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'hotel', 588.00, 888.00, '京都府京都市', 4.8, 256, 10, '["温泉", "日式", "早餐"]', '{"rooms": 50, "check_in": "14:00", "check_out": "11:00", "facilities": ["WiFi", "停车场", "温泉", "餐厅"]}'),
        ('竹林雅居酒店', '被竹林环绕的精品酒店，每间客房都配有落地窗，可欣赏自然美景。', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'hotel', 888.00, NULL, '京都府岚山', 4.9, 189, 5, '["精品", "景观", "安静"]', '{"rooms": 20, "check_in": "15:00", "check_out": "12:00", "facilities": ["WiFi", "停车场", "SPA", "餐厅"]}'),
        ('传统日式旅馆', '体验传统日式文化的绝佳选择，榻榻米房间，提供和服体验服务。', 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800', 'hotel', 1288.00, 1688.00, '东京都浅草', 4.7, 342, 8, '["传统", "文化", "和服"]', '{"rooms": 30, "check_in": "15:00", "check_out": "10:00", "facilities": ["WiFi", "和服租赁", "茶道体验", "传统早餐"]}'),
        ('京都怀石料理', '米其林一星餐厅，提供正宗的京都怀石料理，食材新鲜，摆盘精美。', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 'restaurant', 680.00, 880.00, '京都府祇园', 4.9, 156, 20, '["米其林", "怀石", "精致"]', '{"cuisine": "日式", "meal_type": "晚餐", "duration": "2小时", "dress_code": "正装"}'),
        ('拉面名店', '当地最受欢迎的拉面店，汤底浓郁，面条劲道，配菜丰富。', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'restaurant', 68.00, NULL, '东京都新宿', 4.6, 892, 50, '["拉面", "人气", "平价"]', '{"cuisine": "日式", "meal_type": "午餐/晚餐", "duration": "30分钟", "dress_code": "休闲"}'),
        ('寿司大师店', '由30年经验寿司大师主理，每日新鲜食材，现场制作。', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', 'restaurant', 388.00, 488.00, '东京都银座', 4.8, 234, 15, '["寿司", "新鲜", "大师"]', '{"cuisine": "日式", "meal_type": "晚餐", "duration": "1.5小时", "dress_code": "休闲"}'),
        ('清水寺门票', '京都最著名的寺庙之一，世界文化遗产，可欣赏四季美景。', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800', 'ticket', 88.00, NULL, '京都府清水寺', 4.7, 1234, 999, '["寺庙", "文化", "景点"]', '{"validity": "当日有效", "opening_hours": "06:00-18:00", "includes": ["门票", "导览图"]}'),
        ('富士山一日游', '包含交通、导游、午餐的富士山一日游，欣赏日本第一高峰美景。', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800', 'ticket', 588.00, 688.00, '山梨县富士山', 4.8, 567, 30, '["一日游", "富士山", "交通"]', '{"duration": "8小时", "includes": ["往返交通", "导游", "午餐", "保险"], "departure": "08:00"}'),
        ('东京塔观景台', '登上东京塔观景台，360度俯瞰东京全景，夜景尤其美丽。', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'ticket', 120.00, 150.00, '东京都港区', 4.6, 789, 200, '["观景", "地标", "夜景"]', '{"validity": "当日有效", "opening_hours": "09:00-22:00", "includes": ["观景台门票"]}'),
        ('岚山竹林小径', '漫步在美丽的竹林小径，感受自然与文化的完美融合。', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'ticket', 0.00, NULL, '京都府岚山', 4.9, 2345, 9999, '["免费", "自然", "文化"]', '{"validity": "当日有效", "opening_hours": "全天开放", "includes": ["免费参观"]}')
      `)
      console.log('  ✓ 插入示例商品数据')
    }
  } catch (error) {
    console.error('✗ products 表初始化失败:', error.message)
    throw error
  }
}

// 初始化订单表
async function initOrdersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
        user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
        product_id INT UNSIGNED NOT NULL COMMENT '商品ID',
        product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
        product_image VARCHAR(500) DEFAULT '' COMMENT '商品图片',
        price DECIMAL(10, 2) NOT NULL COMMENT '订单金额',
        payment_method VARCHAR(50) DEFAULT '' COMMENT '支付方式',
        status ENUM('pending', 'paid', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态：pending-待支付, paid-已支付, completed-已完成, cancelled-已取消',
        order_number VARCHAR(50) NOT NULL COMMENT '订单号',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        paid_at TIMESTAMP NULL COMMENT '支付时间',
        PRIMARY KEY (id),
        UNIQUE KEY uniq_order_number (order_number),
        KEY idx_user (user_id),
        KEY idx_product (product_id),
        KEY idx_status (status),
        KEY idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
    `)
    console.log('✓ orders 表初始化成功')
  } catch (error) {
    console.error('✗ orders 表初始化失败:', error.message)
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
    await initProductsTable()
    await initOrdersTable()
    
    console.log('\n✓ 数据库初始化完成！')
    process.exit(0)
  } catch (error) {
    console.error('\n✗ 数据库初始化失败:', error.message)
    process.exit(1)
  }
}

// 运行初始化
main()

