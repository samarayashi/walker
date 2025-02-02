# 徒步旅行地圖

一個用於記錄和分享徒步旅行經驗的網頁應用程序。

## 功能特點

- 📍 在地圖上添加和管理標記點
- 📸 上傳和管理照片
- 🏷️ 標籤系統
- 🔍 搜索和篩選功能
- 📅 日期篩選
- 👤 用戶認證系統
- 📝 地點序列化

## 技術棧

### 前端
- React
- Leaflet (地圖功能)
- Tailwind CSS (樣式)
- Context API (狀態管理)

### 後端
- Node.js
- Express
- MySQL
- Passport.js (認證)

### 部署
- Docker
- Docker Compose

## 開始使用

1. 克隆倉庫：
```bash
git clone [repository-url]
```

2. 安裝依賴：
```bash
# 安裝前端依賴
cd client
npm install

# 安裝後端依賴
cd ../server
npm install
```

3. 設置環境變量：
- 在 `server` 目錄中創建 `.env` 文件
- 在 `client` 目錄中創建 `.env` 文件

4. 啟動開發服務器：
```bash
# 使用 Docker Compose 啟動數據庫
docker-compose up -d

# 啟動後端服務器
cd server
npm run dev

# 啟動前端開發服務器
cd ../client
npm start
```

## 資料庫建立

初始化數據庫：
```bash
# 在 MySQL 容器中執行 SQL 文件
docker exec -i [container-name] mysql -uroot -p[password] hiking_trail < database.sql
```

## TODO
- [ ] 序列編輯：允許abab來回點擊建立路線導致，無法實施點擊取消
- [ ] 序列編輯：只能添加點和刪除整條路線
- [ ] 序列編輯：不能決定路線自己的顏色

