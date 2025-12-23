import { createPool } from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  // 默认改为 3306，更符合 MySQL 默认端口；也可以通过 .env 中的 DB_PORT 覆盖
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'DongYou',
  waitForConnections: true,
  connectionLimit: 10,
})

export default pool

