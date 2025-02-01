import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// 路由導入
import authRoutes from './routes/auth.js';
import markerRoutes from './routes/markers.js';
import photoRoutes from './routes/photos.js';
import serialsRouter from './routes/serials.js';

// 中間件導入
import { errorHandler } from './middleware/errorHandler.js';
import './config/passport.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 中間件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// 靜態文件服務
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/markers', markerRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/serials', serialsRouter);

// 錯誤處理中間件
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 