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
4. 健康保険証が真っ直ぐ撮影されているか（文字が傾いていないか）
5. おくすり手帳が真っ直ぐ撮影されているか（文字が傾いていないか）
6. 健康保険証の内容が指や手の反射・影で隠れているかどうか
7. おくすり手帳の内容が指や手の反射・影で隠れているかどうか
8. 健康保険証の場合、生年月日・氏名・性別が読み取れるかどうか

必ずJSONフォーマットで以下のように返してください：
{
  "isHealthInsuranceCard": boolean,
  "isMedicineNotebook": boolean,
  "isContentVisible": boolean,
  "isHealthInsuranceCardStraight": boolean,
  "isMedicineNotebookStraight": boolean,
  "isHealthInsuranceCardObstructed": boolean,
  "isMedicineNotebookObstructed": boolean,
  "canReadPersonalInfo": boolean,
  "personalInfo": {
    "birthDate": "読み取れた生年月日（読み取れない場合は空文字）",
    "name": "読み取れた氏名（読み取れない場合は空文字）",
    "gender": "読み取れた性別（読み取れない場合は空文字）"
  },
  "analysis": "詳細な分析結果",
  "suggestions": "改善点があれば提案"
}

判定基準：
- isHealthInsuranceCard: 健康保険証や保険証と明確に判定できる場合のみtrue、それ以外はfalse
- isMedicineNotebook: おくすり手帳や薬手帳と明確に判定できる場合のみtrue、それ以外はfalse
- isContentVisible: 文字や詳細情報がはっきりと読み取れる場合true、ぼやけている・見えない場合false
- isHealthInsuranceCardStraight: 健康保険証の文字や枠線が水平に撮影されている場合true、傾いている場合false（健康保険証でない場合はfalse）
- isMedicineNotebookStraight: おくすり手帳の文字や枠線が水平に撮影されている場合true、傾いている場合false（おくすり手帳でない場合はfalse）
- isHealthInsuranceCardObstructed: 健康保険証の内容が指や手の反射・影・光で隠れている場合true、問題ない場合false（健康保険証でない場合はfalse）
- isMedicineNotebookObstructed: おくすり手帳の内容が指や手の反射・影・光で隠れている場合true、問題ない場合false（おくすり手帳でない場合はfalse）
- canReadPersonalInfo: 健康保険証で生年月日・氏名・性別が明確に読み取れる場合true、読み取れない場合false（健康保険証でない場合はfalse）
- personalInfo: 健康保険証から読み取った個人情報（読み取れない場合は空文字）

注意：個人情報は正確に読み取れる場合のみ記録し、不明瞭な場合は空文字にしてください。

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
        isHealthInsuranceCardStraight: parsedResult.isHealthInsuranceCardStraight === true,
        isMedicineNotebookStraight: parsedResult.isMedicineNotebookStraight === true,
        isHealthInsuranceCardObstructed: parsedResult.isHealthInsuranceCardObstructed === true,
        isMedicineNotebookObstructed: parsedResult.isMedicineNotebookObstructed === true,
        canReadPersonalInfo: parsedResult.canReadPersonalInfo === true,
        personalInfo: {
          birthDate: parsedResult.personalInfo?.birthDate || '',
          name: parsedResult.personalInfo?.name || '',
          gender: parsedResult.personalInfo?.gender || ''
        },
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
      const isStraight = text.includes('真っ直ぐ') || text.includes('水平') || (text.includes('傾') && text.includes('ない'));

      analysisResult = {
        isHealthInsuranceCard: isNotDetected ? false : isHealthInsuranceCard,
        isMedicineNotebook: isNotDetected ? false : isMedicineNotebook,
        isContentVisible: text.includes('見える') || text.includes('読める') || text.includes('詳細'),
        isHealthInsuranceCardStraight: isNotDetected ? false : (isHealthInsuranceCard && isStraight),
        isMedicineNotebookStraight: isNotDetected ? false : (isMedicineNotebook && isStraight),
        isHealthInsuranceCardObstructed: isNotDetected ? false : (isHealthInsuranceCard && (text.includes('隠れ') || text.includes('反射') || text.includes('影'))),
        isMedicineNotebookObstructed: isNotDetected ? false : (isMedicineNotebook && (text.includes('隠れ') || text.includes('反射') || text.includes('影'))),
        canReadPersonalInfo: isNotDetected ? false : (isHealthInsuranceCard && (text.includes('氏名') || text.includes('生年月日') || text.includes('性別'))),
        personalInfo: {
          birthDate: '',
          name: '',
          gender: ''
        },
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

// Symptoms analysis endpoint
app.post('/api/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
      return res.status(400).json({ error: 'Symptoms text is required' });
    }

    // Rate limiting check (same as image analysis)
    const now = new Date();
    const today = now.toDateString();

    if (!global.apiUsage) {
      global.apiUsage = {};
    }

    if (!global.apiUsage[today]) {
      global.apiUsage[today] = 0;
    }

    // Check if we've exceeded daily limit
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
以下の症状の説明を分析して、どの症状カテゴリに該当するか判定してください。

症状の説明: "${symptoms}"

症状カテゴリ:
- 発熱
- 咳・喉の痛み
- 花粉症
- 鼻水
- 頭痛
- 吐き気・嘔吐
- アレルギー
- 腹痛
- 下痢
- 便秘
- 皮膚症状
- 胸痛
- 腰痛・背部痛
- 不眠・不安
- その他症状

また、以下の緊急症状に該当する場合は is_emergency を true にしてください：
- 意識がない
- ろれつが回らない
- 今まで経験したことがない頭痛、腹痛
- 頭を強く打った
- 吐血している
- 手足の動きが悪い、または動かない
- けいれんをおこした、けいれんしている

必ずJSONフォーマットで以下のように返してください：
{
  "matched_categories": ["該当する症状カテゴリの配列"],
  "is_emergency": boolean,
  "emergency_reasons": ["緊急の場合、該当する緊急症状の配列"]
}

注意：
- matched_categories は必ず上記の症状カテゴリから選んでください
- 複数のカテゴリに該当する場合は配列に複数入れてください
- 緊急症状に該当しない場合は is_emergency は false にしてください
- emergency_reasons は緊急症状に該当する場合のみ記載してください
`;

    const result = await model.generateContent(prompt);

    // Increment usage counter only after successful API call
    global.apiUsage[today]++;
    console.log(`API usage today: ${global.apiUsage[today]}/50`);

    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    let analysisResult;
    try {
      // Clean the text response
      let cleanText = text.trim();

      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      console.log('Symptoms AI raw response:', text);
      console.log('Symptoms cleaned JSON:', cleanText);

      const parsedResult = JSON.parse(cleanText);

      analysisResult = {
        matched_categories: Array.isArray(parsedResult.matched_categories) ? parsedResult.matched_categories : [],
        is_emergency: parsedResult.is_emergency === true,
        emergency_reasons: Array.isArray(parsedResult.emergency_reasons) ? parsedResult.emergency_reasons : [],
        emergency_guidance: parsedResult.is_emergency === true ? "緊急症状が疑われます。直ちに119番に連絡するか、最寄りの救急医療機関を受診してください。" : null
      };

      console.log('Parsed symptoms analysis result:', analysisResult);
    } catch (e) {
      console.log('Symptoms JSON parsing failed, using fallback:', e);

      // Fallback analysis
      const lowerSymptoms = symptoms.toLowerCase();
      const categories = [];

      // Simple keyword matching for fallback
      if (lowerSymptoms.includes('熱') || lowerSymptoms.includes('発熱')) categories.push('発熱');
      if (lowerSymptoms.includes('咳') || lowerSymptoms.includes('喉') || lowerSymptoms.includes('のど')) categories.push('咳・喉の痛み');
      if (lowerSymptoms.includes('花粉')) categories.push('花粉症');
      if (lowerSymptoms.includes('鼻水') || lowerSymptoms.includes('鼻')) categories.push('鼻水');
      if (lowerSymptoms.includes('頭痛') || lowerSymptoms.includes('頭が痛い')) categories.push('頭痛');
      if (lowerSymptoms.includes('吐き気') || lowerSymptoms.includes('嘔吐') || lowerSymptoms.includes('気持ち悪い')) categories.push('吐き気・嘔吐');
      if (lowerSymptoms.includes('アレルギー')) categories.push('アレルギー');
      if (lowerSymptoms.includes('腹痛') || lowerSymptoms.includes('お腹が痛い')) categories.push('腹痛');
      if (lowerSymptoms.includes('下痢')) categories.push('下痢');
      if (lowerSymptoms.includes('便秘')) categories.push('便秘');
      if (lowerSymptoms.includes('皮膚') || lowerSymptoms.includes('かゆみ') || lowerSymptoms.includes('湿疹')) categories.push('皮膚症状');
      if (lowerSymptoms.includes('胸痛') || lowerSymptoms.includes('胸が痛い')) categories.push('胸痛');
      if (lowerSymptoms.includes('腰痛') || lowerSymptoms.includes('背中') || lowerSymptoms.includes('背部痛')) categories.push('腰痛・背部痛');
      if (lowerSymptoms.includes('不眠') || lowerSymptoms.includes('不安') || lowerSymptoms.includes('眠れない')) categories.push('不眠・不安');

      if (categories.length === 0) categories.push('その他症状');

      // Check for emergency symptoms
      const emergencyReasons = [];
      let isEmergency = false;

      if (lowerSymptoms.includes('意識がない') || lowerSymptoms.includes('意識を失う')) {
        isEmergency = true;
        emergencyReasons.push('意識がない');
      }
      if (lowerSymptoms.includes('ろれつが回らない')) {
        isEmergency = true;
        emergencyReasons.push('ろれつが回らない');
      }
      if (lowerSymptoms.includes('経験したことがない') && (lowerSymptoms.includes('頭痛') || lowerSymptoms.includes('腹痛'))) {
        isEmergency = true;
        emergencyReasons.push('今まで経験したことがない頭痛、腹痛');
      }
      if (lowerSymptoms.includes('頭を強く打った')) {
        isEmergency = true;
        emergencyReasons.push('頭を強く打った');
      }
      if (lowerSymptoms.includes('吐血')) {
        isEmergency = true;
        emergencyReasons.push('吐血している');
      }
      if (lowerSymptoms.includes('手足の動きが悪い') || lowerSymptoms.includes('動かない')) {
        isEmergency = true;
        emergencyReasons.push('手足の動きが悪い、または動かない');
      }
      if (lowerSymptoms.includes('けいれん')) {
        isEmergency = true;
        emergencyReasons.push('けいれんをおこした、けいれんしている');
      }

      analysisResult = {
        matched_categories: categories,
        is_emergency: isEmergency,
        emergency_reasons: emergencyReasons,
        emergency_guidance: isEmergency ? "緊急症状が疑われます。直ちに119番に連絡するか、最寄りの救急医療機関を受診してください。" : null
      };
    }

    res.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({
      error: 'Failed to analyze symptoms',
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
