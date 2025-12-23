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

// 数据库初始化API（开发/管理用）
app.post('/api/admin/init-db', async (_req, res) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[admin] Starting database initialization...')
    
    await ensureUserTable()
    await ensurePostsTable()
    await ensureCommentsTable()
    await ensureLikesTable()
    
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
})

