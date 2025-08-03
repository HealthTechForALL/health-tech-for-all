# オンライン診療初回登録対話&画像認識型サポートAIシステム

Google Gemini Live API を使用したWebカメラによる健康保険証・おくすり手帳のリアルタイム判定システムです。

## 機能

- 📷 **マニュアルカメラ分析**: Webカメラを使用して手動で撮影・判定
- 🏥 **健康保険証判定**: 健康保険証かどうかを自動判定
- 💊 **おくすり手帳判定**: おくすり手帳かどうかを自動判定
- 👁️ **内容可視性判定**: 表紙だけでなく中身がしっかり見える状態かを判定
- � **リアルタイム値表示**: 実際のbool値をリアルタイム表示
- 💡 **改善提案**: より良い撮影のためのアドバイス

## 技術スタック

### バックエンド
- **Node.js** + **Express.js**
- **TypeScript**
- **Google Generative AI** (@google/generative-ai)
- **CORS** サポート

### フロントエンド
- **Vue 3** + **TypeScript**
- **Vite** (開発サーバー・ビルドツール)
- **WebRTC** (getUserMedia API)
- **Canvas API** (画像キャプチャ)
- **レスポンシブデザイン**

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、Google Gemini API キーを設定：

```bash
cp .env.example .env
```

`.env` ファイルを編集：

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

### 3. Google Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. API キーを生成
3. `.env` ファイルに設定

## 開発・実行

### 開発モード

**推奨: 統合開発サーバー**
```bash
./start-dev.sh
# または
npm run dev
```

**静的ファイルモード（プロキシなし）**
```bash
npm run dev:static
```

**個別起動**
```bash
# バックエンドのみ
npm run dev:backend

# フロントエンドのみ（別ターミナル）
npm run dev:frontend
```

### 🌐 アクセスURL

- **メインURL**: http://localhost:3000
  - Viteサーバー起動時: 自動的にVite開発サーバー（ポート3001）にプロキシ
  - Viteサーバー停止時: ビルド済み静的ファイルを配信
- **Vite開発サーバー**: http://localhost:3001（開発時のみ）
- **API**: http://localhost:3000/api/*

### 🔄 動的プロキシ機能

このプロジェクトは革新的な動的プロキシシステムを採用しています：

1. **開発時**: Express（ポート3000）→ Viteプロキシ（ポート3001）
2. **Vite停止時**: Express（ポート3000）→ 静的ファイル配信
3. **本番時**: Express（ポート3000）→ 静的ファイル配信のみ

💡 **メリット**:
- 常にポート3000でアクセス可能
- Viteサーバーの起動/停止を気にする必要なし
- 本番環境と同じURL構成で開発可能

### 個別開発モード

**バックエンドのみ:**
```bash
npm run dev:backend
```

**フロントエンドのみ:**
```bash
npm run dev:frontend
```

### プロダクション実行

```bash
npm run build
npm run build:frontend
npm start
```

### 直接実行（開発用）

```bash
npm run serve
```

## 使用方法

1. サーバーを起動: `npm run dev`
2. ブラウザで `http://localhost:3001` にアクセス（Vue開発サーバー）
3. 「カメラ開始」ボタンをクリックしてWebカメラを起動
4. 健康保険証またはおくすり手帳をカメラに向ける
5. 「撮影・判定」ボタンをクリックして分析実行
6. 判定結果とbool値がリアルタイムで表示されます

## API エンドポイント

### POST /api/analyze-image
画像を分析して判定結果を返します。

**リクエスト:**
```json
{
  "imageData": "data:image/jpeg;base64,..."
}
```

**レスポンス:**
```json
{
  "isHealthInsuranceCard": true,
  "isMedicineNotebook": false,
  "isContentVisible": true,
  "confidence": 0.95,
  "analysis": "詳細な分析結果",
  "suggestions": "改善点があれば提案"
}
```

### GET /api/health
サーバーのヘルスチェック

## プロジェクト構造

```
try-live-api/
├── src/
│   └── server.ts              # Express サーバー（バックエンド専用）
├── vue/                       # Vue.js フロントエンド
│   ├── App.vue                # メインアプリケーション
│   ├── main.ts                # エントリーポイント
│   ├── index.html             # HTMLテンプレート
│   ├── tsconfig.json          # フロントエンド用TypeScript設定
│   ├── components/            # Vueコンポーネント
│   │   ├── CameraSection.vue
│   │   └── ResultsSection.vue
│   └── types/                 # TypeScript型定義
│       └── index.ts
├── dist/                      # コンパイル済みバックエンド
├── dist-frontend/             # ビルド済みフロントエンド
├── vite.config.ts             # Vite設定
├── tsconfig.json              # バックエンド用TypeScript設定
├── .env.example               # 環境変数テンプレート
├── .env                       # 環境変数（要作成）
├── package.json
└── README.md
```

## 注意事項

- Webカメラへのアクセス許可が必要です
- HTTPS環境での実行を推奨します（本番環境）
- Google Gemini API の利用制限にご注意ください
- 個人情報を含む画像の取り扱いには十分注意してください

## トラブルシューティング

### カメラにアクセスできない場合
- ブラウザでカメラの許可が与えられているか確認
- HTTPSでアクセスしているか確認（本番環境）
- 他のアプリケーションがカメラを使用していないか確認

### API エラーが発生する場合
- `.env` ファイルのGEMINI_API_KEYが正しく設定されているか確認
- Google Gemini API の利用制限に達していないか確認
- ネットワーク接続を確認

## ライセンス

ISC License
