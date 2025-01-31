import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function initializeDatabase() {
    // 創建不帶數據庫名的連接
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        // 讀取 SQL 文件
        const sql = fs.readFileSync(path.join(__dirname, '..', 'database.sql'), 'utf8');
        
        // 分割並執行每個 SQL 語句
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (let statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('執行 SQL:', statement.trim());
            }
        }

        console.log('數據庫初始化成功！');
    } catch (error) {
        console.error('初始化數據庫時出錯:', error);
    } finally {
        await connection.end();
    }
}

initializeDatabase(); 