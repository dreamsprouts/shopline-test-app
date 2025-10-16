# SHOPLINE Custom App 授權串接

SHOPLINE Custom App 完成安裝授權串接的最小實作範例。

## 功能

- ✅ 驗證安裝請求（接收 GET）
- ✅ 重定向到授權頁面
- ✅ 接收授權碼（接收 GET callback）
- ✅ 請求 Access Token（發送 POST）
- ✅ 保存 Access Token

## 前置準備

從 [SHOPLINE Developer Center](https://developer.myshopline.com) 取得：
- **App Key** (`appkey`)
- **App Secret** (`appsecret`)
- **Store Handle** (例如：`open001`)
- 設定好 **App Callback URL** (例如：`https://your-app.com/callback`)

### 測試環境資訊

```bash
APP_KEY=4c951e966557c8374d9a61753dfe3c52441aba3b
APP_SECRET=dd46269d6920f49b07e810862d3093062b0fb858
SHOP_HANDLE=paykepoc
SHOP_URL=https://paykepoc.myshopline.com/
```

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `env.example` 為 `.env` 並填入正確的值：

```bash
cp env.example .env
```

編輯 `.env` 檔案：
```bash
APP_KEY=your_app_key_here
APP_SECRET=your_app_secret_here
SHOP_HANDLE=your_shop_handle
CALLBACK_URL=https://your-app.com/callback
```

### 3. 啟動服務

```bash
npm start
```

服務將在 `http://localhost:3000` 啟動

### 4. 測試

訪問 `http://localhost:3000/test` 檢查環境變數設定

## 部署

### Vercel

1. 連接到 Vercel 帳號
2. 選擇 GitHub 倉庫
3. 設定環境變數：
   - `APP_KEY`
   - `APP_SECRET`
   - `CALLBACK_URL`
4. 自動部署完成

或使用 Vercel CLI：
```bash
npm i -g vercel
vercel --prod
```

### 其他平台

支援任何 Node.js 平台（Heroku、Railway、Render 等）

## 測試流程

### 快速測試（使用 paykepoc 測試環境）

1. 設定環境變數：
   ```bash
   export APP_KEY=4c951e966557c8374d9a61753dfe3c52441aba3b
   export APP_SECRET=dd46269d6920f49b07e810862d3093062b0fb858
   ```

2. 啟動服務：`npm start`

3. 在瀏覽器訪問安裝 URL（需要 SHOPLINE 發起，或手動構建帶正確簽名的 URL）

4. 系統會重定向到 SHOPLINE 授權頁面

5. 商家授權後，SHOPLINE 會回調到 `/callback`

6. 檢查 console 查看獲取的 Access Token

## 重要注意事項

1. **簽名驗證**：所有來自 SHOPLINE 的請求都必須驗證簽名
2. **時間戳驗證**：建議額外檢查 timestamp 與當前時間差距不超過 10 分鐘
3. **Access Token 有效期**：10 小時，需要在過期前刷新
4. **Code 有效期**：授權碼 10 分鐘內必須使用
5. **生產環境**：必須使用 HTTPS 並將 Access Token 安全存儲至資料庫

## 錯誤處理

常見錯誤碼：

| 錯誤碼 | 說明 | 解決方案 |
|--------|------|----------|
| `OAUTH_CODE_INVALID` | 授權碼過期或無效 | 重新獲取授權碼 |
| `REQUEST_FREQUENTLY` | 請求過於頻繁 | 稍後重試 |
| `REQUEST_NOT_IN_APP_IP_WHITELIST` | IP 不在白名單 | 在開發者中心設定 IP |
| `TOKEN_CREATE_EXCEPTION` | Token 創建失敗 | 稍後重試 |

## 技術規格

- Node.js + Express
- HMAC-SHA256 簽名驗證
- OAuth 2.0 授權流程
- 支援 HTTPS 部署

## 授權

MIT License
