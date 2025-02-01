import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 創建連接池
export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root_password',
    database: process.env.DB_NAME || 'hiking_trail',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}); 