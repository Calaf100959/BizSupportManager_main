#!/bin/bash
# アプリのデプロイ・更新スクリプト
# 初回・更新時ともに使用可能
# 実行: bash deploy/deploy.sh
set -e

APP_DIR="/var/www/bizsupport"
cd "$APP_DIR"

echo "=== [1/5] 最新コードの取得 ==="
git pull origin main

echo "=== [2/5] 依存関係のインストール ==="
npm ci --omit=dev
# devDependencies も一時的に必要（ビルド用）
npm ci

echo "=== [3/5] ビルド ==="
npm run build

echo "=== [4/5] DBマイグレーション（スキーマ反映） ==="
npm run db:push

echo "=== [5/5] PM2 で起動・再起動 ==="
if pm2 list | grep -q "bizsupport"; then
  pm2 reload bizsupport
else
  pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
fi
pm2 save

echo ""
echo "=== デプロイ完了 ==="
pm2 status bizsupport
