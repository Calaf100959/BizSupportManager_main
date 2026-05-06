#!/bin/bash
# XServer VPS 初回セットアップスクリプト
# Ubuntu 22.04 LTS 想定
# Dify が既に動作している VPS への CRM 追加インストール用
# 実行: bash setup.sh
set -e

APP_DIR="/var/www/bizsupport"
REPO_URL="https://github.com/Calaf100959/BizSupportManager_main.git"

echo "=== 1. Node.js 20 (LTS) のインストール確認 ==="
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "Node.js $(node -v) 検出済み。スキップ。"
fi

echo "=== 2. PM2 のインストール確認 ==="
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  pm2 startup systemd -u root --hp /root
else
  echo "PM2 $(pm2 -v) 検出済み。スキップ。"
fi

echo "=== 3. PM2 ログディレクトリの作成 ==="
mkdir -p /var/log/pm2

echo "=== 4. アプリディレクトリの作成 ==="
mkdir -p "$APP_DIR"

echo "=== 5. リポジトリのクローン ==="
if [ -d "$APP_DIR/.git" ]; then
  echo "リポジトリ既存。git pull を実行します。"
  git -C "$APP_DIR" pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "=== 6. 環境変数ファイルの作成 ==="
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo ">>> .env を編集して環境変数を設定してください:"
  echo "    nano $APP_DIR/.env"
  echo ""
  echo "  GOOGLE_CALLBACK_URL は必ず以下の形式にしてください:"
  echo "    https://YOUR_DOMAIN/crm/api/callback"
  echo ""
else
  echo ".env 既存。スキップ。（内容は手動で確認してください）"
fi

echo ""
echo "=== 7. Nginx への CRM ロケーション追加 ==="
echo ""
echo "Dify の nginx 設定ファイルを開いて、server { } の閉じ括弧の直前に"
echo "以下のファイルの内容を貼り付けてください:"
echo ""
echo "    cat $APP_DIR/deploy/nginx-crm-location.conf"
echo ""
echo "貼り付け後:"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""

echo "=== セットアップ完了 ==="
echo ""
echo "次のステップ:"
echo "  1. nano $APP_DIR/.env              # 環境変数を設定"
echo "  2. Nginx に /crm/ ロケーション追加  # 上記の手順に従って"
echo "  3. Google Cloud Console にコールバックURL追加"
echo "     https://YOUR_DOMAIN/crm/api/callback"
echo "  4. bash $APP_DIR/deploy/deploy.sh  # ビルド＆起動"
