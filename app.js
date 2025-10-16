import express from 'express'
import crypto from 'crypto'

const app = express()

// ===== 工具函數 =====

function verifyGetSignature(query, appSecret) {
  const { sign, ...params } = query
  const sortedKeys = Object.keys(params).sort()
  const source = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
  const expectedSign = crypto.createHmac('sha256', appSecret).update(source).digest('hex')
  return sign === expectedSign
}

function generatePostSignature(body, timestamp, appSecret) {
  const source = body + timestamp
  return crypto.createHmac('sha256', appSecret).update(source).digest('hex')
}

async function requestAccessToken(handle, code, appKey, appSecret) {
  const timestamp = Date.now().toString()
  const body = JSON.stringify({ code })
  const sign = generatePostSignature(body, timestamp, appSecret)
  
  const response = await fetch(
    `https://${handle}.myshopline.com/admin/oauth/token/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appkey': appKey,
        'timestamp': timestamp,
        'sign': sign
      },
      body: body
    }
  )
  
  return await response.json()
}

// ===== 路由 =====

// Step 1 & 2: 驗證安裝請求並重定向到授權頁面
app.get('/', (req, res) => {
  const isValid = verifyGetSignature(req.query, process.env.APP_SECRET)
  if (!isValid) return res.status(403).send('Invalid signature')
  
  const { handle } = req.query
  const authUrl = `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?` +
    `appKey=${process.env.APP_KEY}&responseType=code&` +
    `scope=read_products,write_products&` +
    `redirectUri=${encodeURIComponent(process.env.CALLBACK_URL || 'https://your-app.com/callback')}`
  
  res.redirect(authUrl)
})

// Step 3, 4, 5: 接收授權碼並換取 Access Token
app.get('/callback', async (req, res) => {
  const isValid = verifyGetSignature(req.query, process.env.APP_SECRET)
  if (!isValid) return res.status(403).send('Invalid signature')
  
  const { code, handle } = req.query
  const result = await requestAccessToken(
    handle,
    code,
    process.env.APP_KEY,
    process.env.APP_SECRET
  )
  
  if (result.code !== 200) {
    return res.status(500).send(`Error: ${result.i18nCode}`)
  }
  
  const { accessToken, expireTime, scope } = result.data
  console.log('✅ Authorization successful!')
  console.log('Access Token:', accessToken)
  console.log('Expire Time:', expireTime)
  console.log('Scope:', scope)
  
  // TODO: 存入資料庫
  
  res.send('Authorization successful! Check console for access token.')
})

// 測試頁面
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SHOPLINE Custom App 測試</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .container {
                text-align: center;
                background: white;
                padding: 3rem 2rem;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                max-width: 600px;
            }
            
            h1 {
                color: #333;
                margin-bottom: 2rem;
                font-size: 2rem;
            }
            
            .info {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: left;
            }
            
            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 1rem 2rem;
                font-size: 1.2rem;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                margin: 0.5rem;
                text-decoration: none;
                display: inline-block;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>SHOPLINE Custom App 測試</h1>
            <div class="info">
                <h3>環境變數檢查：</h3>
                <p><strong>APP_KEY:</strong> ${process.env.APP_KEY ? '✅ 已設定' : '❌ 未設定'}</p>
                <p><strong>APP_SECRET:</strong> ${process.env.APP_SECRET ? '✅ 已設定' : '❌ 未設定'}</p>
                <p><strong>CALLBACK_URL:</strong> ${process.env.CALLBACK_URL || '使用預設值'}</p>
            </div>
            <p>請確保已設定正確的環境變數，然後使用 SHOPLINE 發起的安裝請求進行測試。</p>
            <a href="/" class="btn">返回首頁</a>
        </div>
    </body>
    </html>
  `)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 測試頁面: http://localhost:${PORT}/test`)
})
