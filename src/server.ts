import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

// Global type declaration for API usage tracking
declare global {
  var apiUsage: Record<string, number>;
}

const app = express();
const PORT = process.env.PORT || 3000;
const VITE_PORT = 3001;
const VITE_URL = `http://localhost:${VITE_PORT}`;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Viteサーバーの状態をチェックする関数
async function checkViteServer(): Promise<boolean> {
  try {
    const response = await fetch(VITE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(1000) // 1秒でタイムアウト
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 手動プロキシ関数
async function proxyToVite(req: express.Request, res: express.Response) {
  try {
    const viteUrl = `${VITE_URL}${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    const response = await fetch(viteUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'localhost:3001'
      } as any,
      signal: AbortSignal.timeout(10000) // 10秒でタイムアウト
    });

    // レスポンスヘッダーをコピー
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    // ボディをストリーミング
    if (response.body) {
      response.body.pipeTo(new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        }
      }));
    } else {
      res.end();
    }
  } catch (error) {
    console.log('Proxy error:', error);
    throw error; // エラーを上位に投げてフォールバック処理に任せる
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Viteプロキシミドルウェア（条件付き）
app.use(async (req, res, next) => {
  // API リクエストはスキップ
  if (req.path.startsWith('/api')) {
    return next();
  }

  const isViteRunning = await checkViteServer();

  if (isViteRunning) {
    console.log(`📡 Proxying to Vite server: ${req.path}`);

    try {
      await proxyToVite(req, res);
      return; // プロキシ成功時はここで終了
    } catch (error) {
      console.log('Vite proxy failed, falling back to static files:', error);
      // プロキシ失敗時は次のミドルウェア（静的ファイル）に進む
    }
  } else {
    console.log(`📁 Using static files for: ${req.path}`);
  }

  next(); // 静的ファイルミドルウェアに進む
});

// 静的ファイル配信（フォールバック用）
app.use(express.static(path.join(__dirname, '../dist-frontend'), {
  index: false // index.htmlの自動配信を無効化（後で手動制御）
}));

// API Routes
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Rate limiting check (simple in-memory implementation)
    const now = new Date();
    const today = now.toDateString();

    // In production, use Redis or database for persistent storage
    if (!global.apiUsage) {
      global.apiUsage = {};
    }

    if (!global.apiUsage[today]) {
      global.apiUsage[today] = 0;
    }

    // Check if we've exceeded daily limit (45 requests to leave buffer)
    if (global.apiUsage[today] >= 45) {
      return res.status(429).json({
        error: 'Daily API quota exceeded',
        message: 'You have reached the daily limit of 45 requests. Please try again tomorrow.',
        details: 'Google Gemini API free tier allows 50 requests per day. We limit to 45 to prevent service interruption.',
        resetTime: new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString()
      });
    }

    // Get a generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
この画像を詳しく分析して、以下について判定してください：

1. 健康保険証（保険証）かどうか
2. おくすり手帳（薬手帳）かどうか
3. 表紙だけでなく中身（詳細情報）がしっかり見える状態かどうか

必ずJSONフォーマットで以下のように返してください：
{
  "isHealthInsuranceCard": boolean,
  "isMedicineNotebook": boolean,
  "isContentVisible": boolean,
  "analysis": "詳細な分析結果",
  "suggestions": "改善点があれば提案"
}

判定基準：
- isHealthInsuranceCard: 健康保険証や保険証と明確に判定できる場合のみtrue、それ以外はfalse
- isMedicineNotebook: おくすり手帳や薬手帳と明確に判定できる場合のみtrue、それ以外はfalse
- isContentVisible: 文字や詳細情報がはっきりと読み取れる場合true、ぼやけている・見えない場合false
また "analysis" の内容をしっかり反芻し、健康保険証やおくすり手帳ではありません。という結果の場合もしっかり isHealthInsuranceCard や isMedicineNotebook の値をfalseにしてください。

「確認できません」「わかりません」「判定できません」といった場合は、該当するbool値をfalseにしてください。
`;

    // Convert base64 image data to the format expected by Gemini
    const imageBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    // Increment usage counter only after successful API call
    global.apiUsage[today]++;
    console.log(`API usage today: ${global.apiUsage[today]}/50`);

    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    let analysisResult;
    try {
      // Clean the text response - sometimes AI returns extra text around JSON
      let cleanText = text.trim();

      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      console.log('AI raw response:', text);
      console.log('Cleaned JSON:', cleanText);

      const parsedResult = JSON.parse(cleanText);

      // Use the boolean values directly from AI response
      analysisResult = {
        isHealthInsuranceCard: parsedResult.isHealthInsuranceCard === true,
        isMedicineNotebook: parsedResult.isMedicineNotebook === true,
        isContentVisible: parsedResult.isContentVisible === true,
        analysis: parsedResult.analysis || '',
        suggestions: parsedResult.suggestions || "画像をより鮮明に撮影してください"
      };

      console.log('Parsed analysis result:', analysisResult);
    } catch (e) {
      console.log('JSON parsing failed, using fallback:', e);

      // If JSON parsing fails, fallback to text analysis
      const isHealthInsuranceCard = text.includes('保険証') || text.includes('健康保険証');
      const isMedicineNotebook = text.includes('おくすり手帳') || text.includes('薬手帳');
      const isNotDetected = text.includes('確認できません') || text.includes('わかりません') || text.includes('判定できません');

      analysisResult = {
        isHealthInsuranceCard: isNotDetected ? false : isHealthInsuranceCard,
        isMedicineNotebook: isNotDetected ? false : isMedicineNotebook,
        isContentVisible: text.includes('見える') || text.includes('読める') || text.includes('詳細'),
        analysis: text,
        suggestions: "画像をより鮮明に撮影してください"
      };
    }

    res.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({
      error: 'Failed to analyze image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const today = new Date().toDateString();
  const usage = global.apiUsage?.[today] || 0;

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    viteProxy: 'Enabled',
    staticFallback: 'Enabled',
    apiQuota: {
      used: usage,
      limit: 50,
      remaining: Math.max(0, 50 - usage),
      resetDate: today
    }
  });
});

// New endpoint to check API quota
app.get('/api/quota', (req, res) => {
  const today = new Date().toDateString();
  const usage = global.apiUsage?.[today] || 0;

  res.json({
    date: today,
    used: usage,
    limit: 50,
    remaining: Math.max(0, 50 - usage),
    canMakeRequest: usage < 45,
    resetTime: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)).toISOString()
  });
});

// メインのルートとSPAフォールバック
app.get('*', async (req, res) => {
  const isViteRunning = await checkViteServer();

  if (isViteRunning) {
    // Viteサーバーが動いている場合は既にプロキシされているはず
    // ここに到達した場合は何らかの理由でプロキシが失敗したので静的ファイルにフォールバック
    console.log(`🔄 Fallback to static for: ${req.path}`);
  }

  // 静的ビルドのindex.htmlを配信
  const staticPath = path.join(__dirname, '../dist-frontend/index.html');

  try {
    res.sendFile(staticPath);
  } catch (error) {
    res.status(500).json({
      error: 'Frontend not available',
      message: 'Neither Vite server nor built frontend is available',
      details: 'Please run "npm run build:frontend" or start the Vite dev server',
      viteServer: `Expected at ${VITE_URL}`,
      staticFiles: `Expected at ${staticPath}`
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log('Make sure to set your GEMINI_API_KEY in the .env file');

  // Viteサーバーの状態をチェック
  const isViteRunning = await checkViteServer();

  if (isViteRunning) {
    console.log(`📡 Vite dev server detected at ${VITE_URL} - Using proxy mode`);
    console.log(`   Frontend: http://localhost:${PORT} (proxied from Vite)`);
  } else {
    console.log(`📁 Vite dev server not found - Using static files mode`);
    console.log(`   Frontend: http://localhost:${PORT} (static build)`);
    console.log(`   To enable dev mode, start Vite server: npm run dev:frontend`);
  }

  console.log(`   API: http://localhost:${PORT}/api`);
});

export default app;
