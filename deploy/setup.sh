#!/bin/bash
# XServer VPS 初回セットアップスクリプト
# Ubuntu 22.04 LTS 想定
# 実行: bash setup.sh YOUR_DOMAIN
set -e

DOMAIN=${1:?"使い方: bash setup.sh YOUR_DOMAIN"}
APP_DIR="/var/www/bizsupport"
REPO_URL="https://github.com/Calaf100959/BizSupportManager_main.git"

echo "=== 1. システム更新 ==="
apt-get update && apt-get upgrade -y

echo "=== 2. 必要パッケージのインストール ==="
apt-get install -y git nginx certbot python3-certbot-nginx curl

echo "=== 3. Node.js 20 (LTS) のインストール ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== 4. PM2 のインストール ==="
npm install -g pm2
pm2 startup systemd -u root --hp /root

echo "=== 5. アプリディレクトリの作成 ==="
mkdir -p "$APP_DIR"
mkdir -p /var/log/pm2

echo "=== 6. リポジトリのクローン ==="
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

echo "=== 7. 環境変数ファイルの作成 ==="
cp .env.example .env
echo ""
echo ">>> .env を編集して環境変数を設定してください:"
echo "    nano $APP_DIR/.env"
echo ""
echo "設定が完了したら以下を実行してください:"
echo "    bash $APP_DIR/deploy/deploy.sh"
echo ""

echo "=== 8. Nginx の設定 ==="
cp "$APP_DIR/deploy/nginx.conf.example" "/etc/nginx/sites-available/bizsupport"
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/bizsupport
ln -sf /etc/nginx/sites-available/bizsupport /etc/nginx/sites-enabled/bizsupport
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== 9. SSL証明書の取得 (Let's Encrypt) ==="
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || \
  echo "SSL取得に失敗しました。ドメインのDNS設定を確認してください。"

echo ""
echo "=== セットアップ完了 ==="
echo "次のステップ:"
echo "  1. nano $APP_DIR/.env  で環境変数を設定"
echo "  2. bash $APP_DIR/deploy/deploy.sh  でアプリをビルド・起動"
