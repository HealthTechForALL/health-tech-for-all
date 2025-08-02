#!/bin/bash

echo "🚀 統合開発サーバーを起動しています..."

# バックエンドとフロントエンドをビルド
echo "📦 バックエンドをビルド中..."
npm run build:backend

echo "📦 フロントエンドをビルド中..."
npm run build:frontend

echo "🎯 統合開発サーバーを起動中..."
echo ""
echo "🌐 アクセスURL:"
echo "   メイン: http://localhost:3000 (Express + 動的プロキシ)"
echo "   開発用: http://localhost:3001 (Vite開発サーバー - 開発時のみ)"
echo ""
echo "📡 動的プロキシ機能:"
echo "   - Viteサーバーが起動中: localhost:3000 → localhost:3001 (プロキシ)"
echo "   - Viteサーバーが停止中: localhost:3000 → 静的ファイル配信"
echo ""

# 統合開発サーバーを起動
npm run dev
