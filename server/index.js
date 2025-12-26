import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import pool from './db.js'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(morgan('dev'))

// 确保用户表存在：如果没有则自动创建
async function ensureUserTable() {
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
    
    // 为已存在的表添加新字段（如果不存在）
    if (!(await columnExists('login_info', 'avatar'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN avatar VARCHAR(500) DEFAULT '' COMMENT '用户头像'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added avatar column to login_info table')
    }
    
    if (!(await columnExists('login_info', 'gender'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN gender VARCHAR(10) DEFAULT '' COMMENT '性别：male/female/other'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added gender column to login_info table')
    }
    
    if (!(await columnExists('login_info', 'bio'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN bio VARCHAR(200) DEFAULT '' COMMENT '个性签名'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added bio column to login_info table')
    }
    
    if (!(await columnExists('login_info', 'background_image'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN background_image VARCHAR(500) DEFAULT '' COMMENT '背景图片'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added background_image column to login_info table')
    }
    
    if (!(await columnExists('login_info', 'updated_at'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added updated_at column to login_info table')
    }
    
    // 添加管理员相关字段
    if (!(await columnExists('login_info', 'status'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN status VARCHAR(20) DEFAULT 'active' COMMENT '账号状态：active-正常, disabled-禁用'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added status column to login_info table')
    }
    
    if (!(await columnExists('login_info', 'role'))) {
      await pool.query(`ALTER TABLE login_info ADD COLUMN role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色：user-普通用户, admin-管理员'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added role column to login_info table')
    }
    
    // eslint-disable-next-line no-console
    console.log('[db] login_info table is ready')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] init table failed', error)
  }
}

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

// 确保帖子表存在：如果没有则自动创建
async function ensurePostsTable() {
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
    
    // 为已存在的表添加新字段（如果不存在）
    if (!(await columnExists('posts', 'likes_count'))) {
      await pool.query(`ALTER TABLE posts ADD COLUMN likes_count INT UNSIGNED DEFAULT 0 COMMENT '点赞数'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added likes_count column to posts table')
    }
    
    if (!(await columnExists('posts', 'comments_count'))) {
      await pool.query(`ALTER TABLE posts ADD COLUMN comments_count INT UNSIGNED DEFAULT 0 COMMENT '评论数'`)
      // eslint-disable-next-line no-console
      console.log('[db] Added comments_count column to posts table')
    }
    
    // 更新已有帖子的统计数据（使用COALESCE避免NULL）
    try {
      await pool.query(`
        UPDATE posts p
        SET p.likes_count = COALESCE((
          SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id
        ), 0),
        p.comments_count = COALESCE((
          SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id
        ), 0)
      `)
      // eslint-disable-next-line no-console
      console.log('[db] Updated posts statistics')
    } catch (error) {
      // 如果表不存在，忽略错误
      // eslint-disable-next-line no-console
      console.log('[db] Skipping statistics update (tables may not exist yet)')
    }
    
    // eslint-disable-next-line no-console
    console.log('[db] posts table is ready')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] init posts table failed', error)
  }
}

// 确保评论表存在
async function ensureCommentsTable() {
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
    // eslint-disable-next-line no-console
    console.log('[db] comments table is ready')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] init comments table failed', error)
  }
}

// 确保点赞表存在
async function ensureLikesTable() {
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
    // eslint-disable-next-line no-console
    console.log('[db] post_likes table is ready')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] init post_likes table failed', error)
  }
}

// 确保商品表存在
async function ensureProductsTable() {
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
    // eslint-disable-next-line no-console
    console.log('[db] products table is ready')
    
    // 检查是否有数据，如果没有则插入示例数据
    const [existingProducts] = await pool.query('SELECT COUNT(*) as count FROM products')
    if (existingProducts[0].count === 0) {
      try {
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
        // eslint-disable-next-line no-console
        console.log('[db] Inserted sample products data')
      } catch (insertError) {
        // eslint-disable-next-line no-console
        console.log('[db] Skipping sample products insertion (may already exist)')
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] init products table failed', error)
  }
}

app.get('/', (_req, res) => {
  res.json({ message: 'DongYou API is running' })
})

app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body || {}

  if (!phone || !password) {
    return res.status(400).json({ error: '请填写手机号和密码' })
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, phone, name, avatar, gender, bio, background_image 
       FROM login_info 
       WHERE phone = ? AND password = ? 
       LIMIT 1`,
      [phone, password]
    )

    if (!rows.length) {
      return res.status(401).json({ error: '账号不存在，请前往注册' })
    }

    const user = rows[0]
    res.json({
      message: '登录成功',
      token: `mock-token-${user.id}`,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar || '',
        gender: user.gender || '',
        bio: user.bio || '',
        backgroundImage: user.background_image || '',
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[login]', error)
    res.status(500).json({ error: '服务器异常，请稍后再试' })
  }
})

app.post('/api/register', async (req, res) => {
  const { phone, password, name } = req.body || {}

  if (!phone || !password || !name) {
    return res.status(400).json({ error: '请填写完整的注册信息' })
  }

  try {
    const [exists] = await pool.query(
      'SELECT id FROM login_info WHERE phone = ? LIMIT 1',
      [phone]
    )

    if (exists.length) {
      return res.status(409).json({ error: '该手机号已注册' })
    }

    const [result] = await pool.query(
      'INSERT INTO login_info (phone, password, name) VALUES (?, ?, ?)',
      [phone, password, name]
    )

    res.status(201).json({
      message: '注册成功',
      user: { id: result.insertId, phone, name },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[register]', error)
    res.status(500).json({ error: '服务器异常，请稍后再试' })
  }
})

// 获取用户信息（通过ID）
app.get('/api/profile/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, phone, name, avatar, gender, bio, background_image, created_at 
       FROM login_info 
       WHERE id = ? 
       LIMIT 1`,
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: '未找到用户' })
    }

    const user = rows[0]
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar || '',
      gender: user.gender || '',
      bio: user.bio || '',
      backgroundImage: user.background_image || '',
      createdAt: user.created_at,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[profile]', error)
    res.status(500).json({ error: '服务器异常，请稍后再试' })
  }
})

// 获取当前登录用户信息
app.get('/api/user/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const [rows] = await pool.query(
      `SELECT id, phone, name, avatar, gender, bio, background_image, created_at 
       FROM login_info 
       WHERE id = ? 
       LIMIT 1`,
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: '未找到用户' })
    }

    const user = rows[0]
    
    // 获取统计数据
    const [postsCount] = await pool.query('SELECT COUNT(*) as count FROM posts WHERE author_id = ?', [userId])
    const [likesCount] = await pool.query('SELECT COUNT(*) as count FROM post_likes WHERE user_id = ?', [userId])
    const [commentsCount] = await pool.query('SELECT COUNT(*) as count FROM comments WHERE user_id = ?', [userId])

    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar || '',
      gender: user.gender || '',
      bio: user.bio || '',
      backgroundImage: user.background_image || '',
      createdAt: user.created_at,
      stats: {
        postsCount: postsCount[0]?.count || 0,
        likesCount: likesCount[0]?.count || 0,
        commentsCount: commentsCount[0]?.count || 0,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[user me]', error)
    res.status(500).json({ error: '服务器异常，请稍后再试' })
  }
})

// 获取我的攻略
app.get('/api/user/my-posts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const [rows] = await pool.query(
      `SELECT 
        id, 
        title, 
        content, 
        images, 
        author_id, 
        author_name, 
        author_avatar, 
        likes_count,
        comments_count,
        created_at 
      FROM posts 
      WHERE author_id = ?
      ORDER BY created_at DESC 
      LIMIT 100`,
      [userId]
    )

    const posts = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      image: Array.isArray(row.images) && row.images.length > 0 
        ? row.images[0] 
        : (typeof row.images === 'string' ? JSON.parse(row.images || '[]')[0] : ''),
      images: typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (row.images || []),
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar: row.author_avatar || '',
      },
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      createdAt: row.created_at,
    }))

    res.json({ posts })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[my posts]', error)
    res.status(500).json({ error: '获取我的攻略失败' })
  }
})

// 获取我的点赞
app.get('/api/user/my-likes', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const [rows] = await pool.query(
      `SELECT 
        p.id, 
        p.title, 
        p.content, 
        p.images, 
        p.author_id, 
        p.author_name, 
        p.author_avatar, 
        p.likes_count,
        p.comments_count,
        p.created_at,
        pl.created_at as liked_at
      FROM post_likes pl
      INNER JOIN posts p ON pl.post_id = p.id
      WHERE pl.user_id = ?
      ORDER BY pl.created_at DESC 
      LIMIT 100`,
      [userId]
    )

    const posts = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      image: Array.isArray(row.images) && row.images.length > 0 
        ? row.images[0] 
        : (typeof row.images === 'string' ? JSON.parse(row.images || '[]')[0] : ''),
      images: typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (row.images || []),
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar: row.author_avatar || '',
      },
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      createdAt: row.created_at,
      likedAt: row.liked_at,
    }))

    res.json({ posts })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[my likes]', error)
    res.status(500).json({ error: '获取我的点赞失败' })
  }
})

// 获取我的评论
app.get('/api/user/my-comments', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const [rows] = await pool.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.user_name,
        c.user_avatar,
        c.content,
        c.created_at,
        p.title as post_title,
        p.images as post_images
      FROM comments c
      INNER JOIN posts p ON c.post_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC 
      LIMIT 100`,
      [userId]
    )

    const comments = rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar || '',
      content: row.content,
      createdAt: row.created_at,
      post: {
        id: row.post_id,
        title: row.post_title,
        image: Array.isArray(row.post_images) && row.post_images.length > 0 
          ? row.post_images[0] 
          : (typeof row.post_images === 'string' ? JSON.parse(row.post_images || '[]')[0] : ''),
      },
    }))

    res.json({ comments })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[my comments]', error)
    res.status(500).json({ error: '获取我的评论失败' })
  }
})

// 获取帖子列表
app.get('/api/posts', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id, 
        title, 
        content, 
        images, 
        author_id, 
        author_name, 
        author_avatar, 
        likes_count,
        comments_count,
        created_at 
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 100`
    )

    const posts = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      image: Array.isArray(row.images) && row.images.length > 0 
        ? row.images[0] 
        : (typeof row.images === 'string' ? JSON.parse(row.images || '[]')[0] : ''),
      images: typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (row.images || []),
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar: row.author_avatar || '',
      },
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      createdAt: row.created_at,
    }))

    res.json({ posts })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[posts]', error)
    res.status(500).json({ error: '获取帖子列表失败' })
  }
})

// 获取单个帖子详情
app.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: '无效的帖子ID' })
    }

    const [rows] = await pool.query(
      `SELECT 
        id, 
        title, 
        content, 
        images, 
        author_id, 
        author_name, 
        author_avatar, 
        likes_count,
        comments_count,
        created_at 
      FROM posts 
      WHERE id = ? 
      LIMIT 1`,
      [postId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    const row = rows[0]
    const post = {
      id: row.id,
      title: row.title,
      content: row.content,
      images: typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (row.images || []),
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar: row.author_avatar || '',
      },
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      createdAt: row.created_at,
    }

    res.json({ post })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[get post]', error)
    res.status(500).json({ error: '获取帖子详情失败' })
  }
})

// 创建帖子
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, images, author } = req.body || {}

    // 验证必填字段
    if (!title || !title.trim()) {
      return res.status(400).json({ error: '标题不能为空' })
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '内容不能为空' })
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '至少需要上传一张图片' })
    }

    // 从token中获取用户ID（简化处理，实际应该验证token）
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let authorId = 0

    if (token && token.startsWith('mock-token-')) {
      authorId = parseInt(token.replace('mock-token-', '')) || 0
    }

    // 确保images数组中的每个元素都是字符串（base64或URL）
    const validImages = images.filter(img => img && typeof img === 'string')

    if (validImages.length === 0) {
      return res.status(400).json({ error: '图片格式无效' })
    }

    const [result] = await pool.query(
      `INSERT INTO posts (title, content, images, author_id, author_name, author_avatar) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        content.trim(),
        JSON.stringify(validImages),
        authorId,
        author?.name || '匿名用户',
        author?.avatar || '',
      ]
    )

    // 确保返回JSON格式
    res.status(201).setHeader('Content-Type', 'application/json').json({
      message: '发布成功',
      post: {
        id: result.insertId,
        title: title.trim(),
        content: content.trim(),
        images: validImages,
        author: {
          id: authorId,
          name: author?.name || '匿名用户',
          avatar: author?.avatar || '',
        },
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[create post]', error)
    // 确保错误响应也是JSON格式
    res.status(500).setHeader('Content-Type', 'application/json').json({ 
      error: '发布失败，请稍后再试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// 点赞/取消点赞帖子
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: '无效的帖子ID' })
    }

    // 从token中获取用户ID
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    // 检查帖子是否存在
    const [postCheck] = await pool.query('SELECT id FROM posts WHERE id = ? LIMIT 1', [postId])
    if (!postCheck.length) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    // 检查是否已点赞
    const [existing] = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ? LIMIT 1',
      [postId, userId]
    )

    if (existing.length > 0) {
      // 取消点赞
      await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId])
      await pool.query('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?', [postId])
      
      // 获取更新后的点赞数
      const [updated] = await pool.query('SELECT likes_count FROM posts WHERE id = ?', [postId])
      res.json({ 
        liked: false, 
        message: '已取消点赞',
        likesCount: updated[0]?.likes_count || 0
      })
    } else {
      // 点赞
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId])
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId])
      
      // 获取更新后的点赞数
      const [updated] = await pool.query('SELECT likes_count FROM posts WHERE id = ?', [postId])
      res.json({ 
        liked: true, 
        message: '点赞成功',
        likesCount: updated[0]?.likes_count || 0
      })
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[like post]', error)
    res.status(500).json({ error: '操作失败', details: error.message })
  }
})

// 检查用户是否已点赞
app.get('/api/posts/:id/like-status', async (req, res) => {
  try {
    const postId = parseInt(req.params.id)
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.json({ liked: false })
    }

    const [rows] = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ? LIMIT 1',
      [postId, userId]
    )

    res.json({ liked: rows.length > 0 })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[check like status]', error)
    res.json({ liked: false })
  }
})

// 获取帖子评论列表
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: '无效的帖子ID' })
    }

    const [rows] = await pool.query(
      `SELECT 
        id,
        post_id,
        user_id,
        user_name,
        user_avatar,
        content,
        created_at
      FROM comments
      WHERE post_id = ?
      ORDER BY created_at ASC`,
      [postId]
    )

    const comments = rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar || '',
      content: row.content,
      createdAt: row.created_at,
    }))

    res.json({ comments })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[get comments]', error)
    res.status(500).json({ error: '获取评论失败' })
  }
})

// 添加评论
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id)
    const { content } = req.body || {}

    if (!postId) {
      return res.status(400).json({ error: '无效的帖子ID' })
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '评论内容不能为空' })
    }

    // 从token中获取用户ID
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    // 获取用户信息
    const [userRows] = await pool.query(
      'SELECT name FROM login_info WHERE id = ? LIMIT 1',
      [userId]
    )

    const userName = userRows.length > 0 ? userRows[0].name : '匿名用户'

    // 检查帖子是否存在
    const [postCheck] = await pool.query('SELECT id FROM posts WHERE id = ? LIMIT 1', [postId])
    if (!postCheck.length) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    // 插入评论
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, user_name, content) VALUES (?, ?, ?, ?)',
      [postId, userId, userName, content.trim()]
    )

    // 更新帖子评论数
    await pool.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId])

    // 获取更新后的评论数和评论详情
    const [updated] = await pool.query('SELECT comments_count FROM posts WHERE id = ?', [postId])
    const [newComment] = await pool.query(
      `SELECT id, post_id, user_id, user_name, user_avatar, content, created_at 
       FROM comments WHERE id = ? LIMIT 1`,
      [result.insertId]
    )

    res.status(201).json({
      message: '评论成功',
      comment: newComment.length > 0 ? {
        id: newComment[0].id,
        postId: newComment[0].post_id,
        userId: newComment[0].user_id,
        userName: newComment[0].user_name,
        userAvatar: newComment[0].user_avatar || '',
        content: newComment[0].content,
        createdAt: newComment[0].created_at,
      } : {
        id: result.insertId,
        postId,
        userId,
        userName,
        content: content.trim(),
      },
      commentsCount: updated[0]?.comments_count || 0,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[add comment]', error)
    res.status(500).json({ error: '评论失败' })
  }
})

// 图片上传（简化版：返回base64 URL，实际应该保存到文件系统或云存储）
app.post('/api/upload', async (req, res) => {
  try {
    // 这里简化处理，实际应该使用multer等中间件处理文件上传
    // 暂时返回一个占位URL，实际项目中应该上传到文件系统或云存储
    const imageUrl = `https://via.placeholder.com/400x500/ffc7d1/ffffff?text=Uploaded+Image`
    
    res.json({
      url: imageUrl,
      message: '上传成功（开发模式）',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[upload]', error)
    res.status(500).json({ error: '上传失败' })
  }
})

// 更新用户信息
app.put('/api/user/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const { avatar, bio, gender, backgroundImage } = req.body || {}
    const updates = []
    const values = []

    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }

    if (bio !== undefined) {
      updates.push('bio = ?')
      values.push(bio)
    }

    if (gender !== undefined) {
      updates.push('gender = ?')
      values.push(gender)
    }

    if (backgroundImage !== undefined) {
      updates.push('background_image = ?')
      values.push(backgroundImage)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' })
    }

    values.push(userId)
    await pool.query(
      `UPDATE login_info SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // 返回更新后的用户信息
    const [rows] = await pool.query(
      `SELECT id, phone, name, avatar, gender, bio, background_image, created_at 
       FROM login_info 
       WHERE id = ? 
       LIMIT 1`,
      [userId]
    )

    const user = rows[0]
    res.json({
      message: '更新成功',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar || '',
        gender: user.gender || '',
        bio: user.bio || '',
        backgroundImage: user.background_image || '',
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[update profile]', error)
    res.status(500).json({ error: '更新失败' })
  }
})

// 删除攻略
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: '无效的帖子ID' })
    }

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    // 检查帖子是否存在且属于当前用户
    const [postRows] = await pool.query(
      'SELECT id, author_id FROM posts WHERE id = ? LIMIT 1',
      [postId]
    )

    if (!postRows.length) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    if (postRows[0].author_id !== userId) {
      return res.status(403).json({ error: '无权删除此帖子' })
    }

    // 删除关联的点赞和评论
    await pool.query('DELETE FROM post_likes WHERE post_id = ?', [postId])
    await pool.query('DELETE FROM comments WHERE post_id = ?', [postId])
    
    // 删除帖子
    await pool.query('DELETE FROM posts WHERE id = ?', [postId])

    res.json({ message: '删除成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[delete post]', error)
    res.status(500).json({ error: '删除失败' })
  }
})

// 删除评论
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id)
    if (!commentId) {
      return res.status(400).json({ error: '无效的评论ID' })
    }

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    // 检查评论是否存在且属于当前用户
    const [commentRows] = await pool.query(
      'SELECT id, user_id, post_id FROM comments WHERE id = ? LIMIT 1',
      [commentId]
    )

    if (!commentRows.length) {
      return res.status(404).json({ error: '评论不存在' })
    }

    if (commentRows[0].user_id !== userId) {
      return res.status(403).json({ error: '无权删除此评论' })
    }

    const postId = commentRows[0].post_id

    // 删除评论
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId])

    // 更新帖子评论数
    await pool.query('UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ?', [postId])

    res.json({ message: '删除成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[delete comment]', error)
    res.status(500).json({ error: '删除失败' })
  }
})

// 获取商品列表
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query
    let query = 'SELECT * FROM products WHERE 1=1'
    const params = []
    
    if (category && ['hotel', 'restaurant', 'ticket'].includes(category)) {
      query += ' AND category = ?'
      params.push(category)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const [rows] = await pool.query(query, params)
    
    // 处理 JSON 字段
    const products = rows.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      location: product.location,
      rating: parseFloat(product.rating),
      salesCount: product.sales_count,
      stock: product.stock,
      tags: product.tags ? (typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags) : [],
      details: product.details ? (typeof product.details === 'string' ? JSON.parse(product.details) : product.details) : {},
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }))
    
    res.json({ products })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[get products]', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// 获取单个商品详情
app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    if (!productId) {
      return res.status(400).json({ error: '无效的商品ID' })
    }
    
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? LIMIT 1', [productId])
    
    if (!rows.length) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    const product = rows[0]
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      location: product.location,
      rating: parseFloat(product.rating),
      salesCount: product.sales_count,
      stock: product.stock,
      tags: product.tags ? (typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags) : [],
      details: product.details ? (typeof product.details === 'string' ? JSON.parse(product.details) : product.details) : {},
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }
    
    res.json({ product: productData })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[get product]', error)
    res.status(500).json({ error: '获取商品详情失败' })
  }
})

// 确保订单表存在
async function ensureOrdersTable() {
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
    // eslint-disable-next-line no-console
    console.log('[db] orders table is ready')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] init orders table failed', error)
  }
}

// 创建订单
app.post('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const { productId, productName, price, paymentMethod } = req.body

    if (!productId || !productName || price === undefined) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 获取商品信息
    const [productRows] = await pool.query('SELECT image FROM products WHERE id = ? LIMIT 1', [productId])
    const productImage = productRows.length > 0 ? (productRows[0].image || '') : ''

    // 生成订单号
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // 创建订单
    const [result] = await pool.query(
      `INSERT INTO orders (user_id, product_id, product_name, product_image, price, payment_method, order_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, productId, productName, productImage, price, paymentMethod || '', orderNumber]
    )

    const orderId = result.insertId

    res.json({
      message: '订单创建成功',
      order: {
        id: orderId,
        orderNumber,
        productId,
        productName,
        productImage,
        price: parseFloat(price),
        paymentMethod: paymentMethod || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[create order]', error)
    res.status(500).json({ error: '创建订单失败' })
  }
})

// 获取用户订单列表
app.get('/api/user/my-orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const [rows] = await pool.query(
      `SELECT id, product_id, product_name, product_image, price, payment_method, status, order_number, created_at, paid_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    )

    const orders = rows.map(order => ({
      id: order.id,
      productId: order.product_id,
      productName: order.product_name,
      productImage: order.product_image || '',
      price: parseFloat(order.price),
      paymentMethod: order.payment_method || '',
      status: order.status,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      paidAt: order.paid_at || null
    }))

    res.json({ orders })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[get orders]', error)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// 更新订单状态（支付成功后）
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    let userId = 0

    if (token && token.startsWith('mock-token-')) {
      userId = parseInt(token.replace('mock-token-', '')) || 0
    }

    if (!userId) {
      return res.status(401).json({ error: '请先登录' })
    }

    const orderId = parseInt(req.params.id)
    const { status } = req.body

    if (!['pending', 'paid', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' })
    }

    // 检查订单是否存在且属于当前用户
    const [orderRows] = await pool.query(
      'SELECT id FROM orders WHERE id = ? AND user_id = ? LIMIT 1',
      [orderId, userId]
    )

    if (!orderRows.length) {
      return res.status(404).json({ error: '订单不存在' })
    }

    // 更新订单状态
    const updateFields = ['status = ?']
    const updateValues = [status]

    if (status === 'paid') {
      updateFields.push('paid_at = ?')
      updateValues.push(new Date())
    }

    updateValues.push(orderId)

    await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    )

    res.json({ message: '订单状态更新成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[update order status]', error)
    res.status(500).json({ error: '更新订单状态失败' })
  }
})

// ==================== 管理员API ====================

// 获取用户列表（管理员）
app.get('/api/admin/users', async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    let query = 'SELECT id, phone, name, avatar, gender, bio, status, role, created_at FROM login_info WHERE 1=1'
    let countQuery = 'SELECT COUNT(*) as total FROM login_info WHERE 1=1'
    const params = []
    
    if (keyword) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR id = ?)'
      countQuery += ' AND (name LIKE ? OR phone LIKE ? OR id = ?)'
      const keywordParam = `%${keyword}%`
      params.push(keywordParam, keywordParam, keyword)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const [countRows] = await pool.query(countQuery, params)
    const total = countRows[0].total
    
    const [rows] = await pool.query(query, [...params, limit, offset])
    
    const users = rows.map(user => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      registerTime: user.created_at,
      status: user.status || 'active',
      role: user.role || 'user'
    }))
    
    res.json({ users, total })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin users]', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

// 获取单个用户信息（管理员）
app.get('/api/admin/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const [rows] = await pool.query(
      'SELECT id, phone, name, avatar, gender, bio, status, role, created_at FROM login_info WHERE id = ? LIMIT 1',
      [userId]
    )
    
    if (!rows.length) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    const user = rows[0]
    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      registerTime: user.created_at,
      status: user.status || 'active',
      role: user.role || 'user'
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin user]', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// 更新用户信息（管理员）
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { name, phone, status, role } = req.body
    
    // 检查用户是否存在
    const [userRows] = await pool.query('SELECT id FROM login_info WHERE id = ? LIMIT 1', [userId])
    if (!userRows.length) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    // 如果更新手机号，检查是否重复
    if (phone) {
      const [phoneRows] = await pool.query('SELECT id FROM login_info WHERE phone = ? AND id != ? LIMIT 1', [phone, userId])
      if (phoneRows.length) {
        return res.status(400).json({ error: '手机号已存在' })
      }
    }
    
    const updateFields = []
    const updateValues = []
    
    if (name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?')
      updateValues.push(phone)
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }
    if (role !== undefined) {
      updateFields.push('role = ?')
      updateValues.push(role)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' })
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(userId)
    
    await pool.query(
      `UPDATE login_info SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    res.json({ message: '更新用户成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin update user]', error)
    res.status(500).json({ error: '更新用户失败' })
  }
})

// 新增用户（管理员）
app.post('/api/admin/users', async (req, res) => {
  try {
    const { name, phone, password, status = 'active', role = 'user' } = req.body
    
    if (!name || !phone || !password) {
      return res.status(400).json({ error: '请填写用户名、手机号和密码' })
    }
    
    // 检查手机号是否已存在
    const [phoneRows] = await pool.query('SELECT id FROM login_info WHERE phone = ? LIMIT 1', [phone])
    if (phoneRows.length) {
      return res.status(400).json({ error: '手机号已存在' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO login_info (phone, password, name, status, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [phone, password, name, status, role]
    )
    
    res.json({ 
      message: '新增用户成功',
      userId: result.insertId
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin create user]', error)
    res.status(500).json({ error: '新增用户失败' })
  }
})

// 删除用户（管理员）
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    const [result] = await pool.query('DELETE FROM login_info WHERE id = ?', [userId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    res.json({ message: '删除用户成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin delete user]', error)
    res.status(500).json({ error: '删除用户失败' })
  }
})

// 批量删除用户（管理员）
app.post('/api/admin/users/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要删除的用户' })
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const [result] = await pool.query(
      `DELETE FROM login_info WHERE id IN (${placeholders})`,
      ids
    )
    
    res.json({ 
      message: `成功删除 ${result.affectedRows} 个用户`,
      deletedCount: result.affectedRows
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin batch delete users]', error)
    res.status(500).json({ error: '批量删除用户失败' })
  }
})

// 获取商品列表（管理员）
app.get('/api/admin/products', async (req, res) => {
  try {
    const { name, category, page = 1, pageSize = 10 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    let query = 'SELECT * FROM products WHERE 1=1'
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1'
    const params = []
    
    if (name) {
      query += ' AND name LIKE ?'
      countQuery += ' AND name LIKE ?'
      params.push(`%${name}%`)
    }
    
    if (category) {
      query += ' AND category = ?'
      countQuery += ' AND category = ?'
      params.push(category)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const [countRows] = await pool.query(countQuery, params)
    const total = countRows[0].total
    
    const [rows] = await pool.query(query, [...params, limit, offset])
    
    const products = rows.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: parseFloat(product.price),
      stock: product.stock,
      image: product.image || '',
      description: product.description || ''
    }))
    
    res.json({ products, total })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin products]', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// 更新商品（管理员）
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    const { name, category, price, stock, image, description } = req.body
    
    // 检查商品是否存在
    const [productRows] = await pool.query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId])
    if (!productRows.length) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    const updateFields = []
    const updateValues = []
    
    if (name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    if (category !== undefined) {
      updateFields.push('category = ?')
      updateValues.push(category)
    }
    if (price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }
    if (stock !== undefined) {
      updateFields.push('stock = ?')
      updateValues.push(stock)
    }
    if (image !== undefined) {
      updateFields.push('image = ?')
      updateValues.push(image)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' })
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(productId)
    
    await pool.query(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    res.json({ message: '更新商品成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin update product]', error)
    res.status(500).json({ error: '更新商品失败' })
  }
})

// 新增商品（管理员）
app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, category, price, stock, image, description } = req.body
    
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ error: '请填写商品名称、分类、价格和库存' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO products (name, category, price, stock, image, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [name, category, price, stock, image || '', description || '']
    )
    
    res.json({ 
      message: '新增商品成功',
      productId: result.insertId
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin create product]', error)
    res.status(500).json({ error: '新增商品失败' })
  }
})

// 删除商品（管理员）
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [productId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    res.json({ message: '删除商品成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin delete product]', error)
    res.status(500).json({ error: '删除商品失败' })
  }
})

// 批量删除商品（管理员）
app.post('/api/admin/products/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要删除的商品' })
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const [result] = await pool.query(
      `DELETE FROM products WHERE id IN (${placeholders})`,
      ids
    )
    
    res.json({ 
      message: `成功删除 ${result.affectedRows} 个商品`,
      deletedCount: result.affectedRows
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin batch delete products]', error)
    res.status(500).json({ error: '批量删除商品失败' })
  }
})

// 获取订单列表（管理员）
app.get('/api/admin/orders', async (req, res) => {
  try {
    const { orderNumber, status, page = 1, pageSize = 10 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    let query = `
      SELECT o.id, o.order_number, o.user_id, o.product_id, o.product_name, o.product_image,
             o.price, o.payment_method, o.status, o.created_at, o.paid_at,
             u.name as user_name, u.phone as user_phone
      FROM orders o
      LEFT JOIN login_info u ON o.user_id = u.id
      WHERE 1=1
    `
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1'
    const params = []
    const countParams = []
    
    if (orderNumber) {
      query += ' AND o.order_number LIKE ?'
      countQuery += ' AND order_number LIKE ?'
      params.push(`%${orderNumber}%`)
      countParams.push(`%${orderNumber}%`)
    }
    
    if (status) {
      query += ' AND o.status = ?'
      countQuery += ' AND status = ?'
      params.push(status)
      countParams.push(status)
    }
    
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
    
    const [countRows] = await pool.query(countQuery, countParams)
    const total = countRows[0].total
    
    const [rows] = await pool.query(query, [...params, limit, offset])
    
    const orders = rows.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      userName: order.user_name || '未知用户',
      userPhone: order.user_phone || '',
      productName: order.product_name,
      amount: parseFloat(order.price),
      orderTime: order.created_at,
      status: order.status
    }))
    
    res.json({ orders, total })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin orders]', error)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// 更新订单（管理员）
app.put('/api/admin/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id)
    const { status } = req.body
    
    // 检查订单是否存在
    const [orderRows] = await pool.query('SELECT id FROM orders WHERE id = ? LIMIT 1', [orderId])
    if (!orderRows.length) {
      return res.status(404).json({ error: '订单不存在' })
    }
    
    if (status && !['pending', 'paid', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' })
    }
    
    const updateFields = []
    const updateValues = []
    
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
      
      if (status === 'paid' && !orderRows[0].paid_at) {
        updateFields.push('paid_at = ?')
        updateValues.push(new Date())
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' })
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(orderId)
    
    await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    res.json({ message: '更新订单成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin update order]', error)
    res.status(500).json({ error: '更新订单失败' })
  }
})

// 删除订单（管理员）
app.delete('/api/admin/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id)
    
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [orderId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '订单不存在' })
    }
    
    res.json({ message: '删除订单成功' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin delete order]', error)
    res.status(500).json({ error: '删除订单失败' })
  }
})

// 批量删除订单（管理员）
app.post('/api/admin/orders/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要删除的订单' })
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const [result] = await pool.query(
      `DELETE FROM orders WHERE id IN (${placeholders})`,
      ids
    )
    
    res.json({ 
      message: `成功删除 ${result.affectedRows} 个订单`,
      deletedCount: result.affectedRows
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin batch delete orders]', error)
    res.status(500).json({ error: '批量删除订单失败' })
  }
})

// 数据库初始化API（开发/管理用）
app.post('/api/admin/init-db', async (_req, res) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[admin] Starting database initialization...')
    
    await ensureUserTable()
    await ensurePostsTable()
    await ensureCommentsTable()
    await ensureLikesTable()
    await ensureProductsTable()
    await ensureOrdersTable()
    
    // eslint-disable-next-line no-console
    console.log('[admin] Database initialization completed')
    
    res.json({ 
      message: '数据库初始化成功',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin] Database initialization failed', error)
    res.status(500).json({ 
      error: '数据库初始化失败',
      details: error.message
    })
  }
})

// 404处理 - 必须在所有路由之后
app.use((req, res) => {
  res.status(404).json({ 
    error: '接口不存在',
    path: req.path,
    method: req.method
  })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`)
  // 启动时检查并创建表
  void ensureUserTable()
  void ensurePostsTable()
  void ensureCommentsTable()
  void ensureLikesTable()
  void ensureProductsTable()
  void ensureOrdersTable()
})

