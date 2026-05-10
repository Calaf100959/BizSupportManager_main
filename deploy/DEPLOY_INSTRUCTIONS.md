# BizSupportManager — Ubuntu Mini PC デプロイ作業指示書
# （Claude Code エージェント向け）

## ミッション
GitHubリポジトリのコードを Ubuntu mini PC にデプロイし、
ブラウザからアクセスできる状態にする。

---

## 事前確認事項（作業開始前に必ずユーザーに確認）

以下の4点をユーザーに確認してから作業を進めること。

1. **アクセス方法**
   - (A) ローカルネットワーク内のみ（例: `http://192.168.x.x`）
   - (B) 外部公開あり（独自ドメインまたはDDNS使用）

2. **このサーバーに他のサービスが動いているか**
   - (A) このCRMアプリ専用サーバー → ルートパス `/` で公開
   - (B) 他サービス（Difyなど）と共存 → サブパス `/crm/` で公開

3. **環境変数の値**（以下をユーザーから受け取る）
   - `DATABASE_URL` (Neon PostgreSQLの接続文字列)
   - `SESSION_SECRET` (任意の長いランダム文字列。未設定なら `openssl rand -hex 32` で生成)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL` ← アクセス方法が決まってから確定（後述）
   - `AI_INTEGRATIONS_OPENAI_API_KEY` (OpenAI APIキー)
   - Gmail関連（請求書メール送信を使う場合のみ）:
     `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_USER`

4. **ドメイン名またはIPアドレス**（`GOOGLE_CALLBACK_URL` の決定に必要）

---

## システム構成（完成イメージ）

```
ブラウザ
  ↓ HTTP/HTTPS
Nginx (80/443)
  ↓ リバースプロキシ
Node.js / Express (port 5000)  ← PM2で管理
  ↓
Neon PostgreSQL (外部クラウドDB、変更なし)
```

---

## Step 1: システムの更新と必要パッケージのインストール

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git nginx curl
```

---

## Step 2: Node.js 20 (LTS) のインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # v20.x.x と表示されればOK
npm -v
```

---

## Step 3: PM2 のインストール

```bash
sudo npm install -g pm2
```

---

## Step 4: アプリディレクトリの準備とリポジトリのクローン

```bash
sudo mkdir -p /var/www/bizsupport
sudo chown $USER:$USER /var/www/bizsupport
git clone https://github.com/Calaf100959/BizSupportManager_main.git /var/www/bizsupport
cd /var/www/bizsupport
```

---

## Step 5: 環境変数ファイルの作成

```bash
cd /var/www/bizsupport
cp .env.example .env
nano .env   # または好みのエディタで編集
```

### GOOGLE_CALLBACK_URL の決め方

**ケースA（ローカルのみ・専用サーバー）:**
```
GOOGLE_CALLBACK_URL=http://192.168.x.x/api/callback
```

**ケースB（ローカルのみ・他サービスと共存）:**
```
GOOGLE_CALLBACK_URL=http://192.168.x.x/crm/api/callback
```

**ケースC（外部公開・専用サーバー）:**
```
GOOGLE_CALLBACK_URL=https://your-domain.com/api/callback
```

**ケースD（外部公開・他サービスと共存）:**
```
GOOGLE_CALLBACK_URL=https://your-domain.com/crm/api/callback
```

### .env ファイルの内容例

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
SESSION_SECRET=（openssl rand -hex 32 の出力）
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_CALLBACK_URL=http://192.168.x.x/api/callback  ← ケースに応じて変更
AI_INTEGRATIONS_OPENAI_API_KEY=sk-xxxx
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
NODE_ENV=production
PORT=5000
```

---

## Step 6: 依存関係インストールとビルド

```bash
cd /var/www/bizsupport
npm ci
npm run build
```

ビルド成功の確認:
```bash
ls dist/          # index.js があること
ls dist/public/   # index.html があること
```

---

## Step 7: DBスキーマの反映

```bash
cd /var/www/bizsupport
npm run db:push
```

---

## Step 8: PM2 の設定とアプリ起動

```bash
cd /var/www/bizsupport

# ecosystem.config.cjs を確認（すでに存在する）
cat deploy/ecosystem.config.cjs
```

`deploy/ecosystem.config.cjs` の `cwd` が `/var/www/bizsupport` になっていることを確認。
なっていなければ修正する。

```bash
# PM2 でアプリ起動
pm2 start /var/www/bizsupport/deploy/ecosystem.config.cjs

# 起動確認
pm2 status
pm2 logs bizsupport --lines 20

# サーバー再起動時に自動起動する設定
pm2 startup
# → 表示されたコマンドをコピーして実行（sudo が必要）
pm2 save
```

---

## Step 9: Nginx の設定

### ケース①: 専用サーバー（ルートパス `/`）

`/etc/nginx/sites-available/bizsupport` を作成:

```nginx
server {
    listen 80;
    server_name _;   # IPアドレス直接アクセスの場合

    client_max_body_size 10M;
    access_log /var/log/nginx/bizsupport_access.log;
    error_log  /var/log/nginx/bizsupport_error.log;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/bizsupport /etc/nginx/sites-enabled/bizsupport
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### ケース②: 他サービスと共存（サブパス `/crm/`）

既存の nginx 設定ファイル（Dify等が使っているファイル）を開き、
`server { }` ブロックの閉じ括弧 `}` の直前に以下を追記:

```nginx
    location /crm/ {
        proxy_pass         http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 10: SSL/HTTPS の設定（外部公開する場合のみ）

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

ローカルネットワーク内のみでの使用なら **このStepはスキップ**。

---

## Step 11: Google Cloud Console の設定更新

ユーザーに以下の操作を依頼する:

1. https://console.cloud.google.com にアクセス
2. 「APIとサービス」→「認証情報」→ OAuthクライアントIDを選択
3. 「承認済みのリダイレクトURI」に `.env` の `GOOGLE_CALLBACK_URL` と同じ値を追加
4. 「保存」

---

## Step 12: 動作確認

```bash
# アプリの状態確認
pm2 status
pm2 logs bizsupport --lines 30

# Nginx の状態確認
sudo systemctl status nginx

# ポート確認
sudo ss -tlnp | grep -E '80|443|5000'
```

ブラウザで以下にアクセスして確認（ケースに応じて）:
- ケース①専用: `http://192.168.x.x/` または `https://your-domain.com/`
- ケース②共存: `http://192.168.x.x/crm/` または `https://your-domain.com/crm/`

Googleログイン画面が表示されれば成功。

---

## 今後のアップデート手順（コード変更時）

```bash
cd /var/www/bizsupport
git pull origin main
npm ci
npm run build
npm run db:push   # スキーマ変更がある場合のみ
pm2 reload bizsupport
```

---

## トラブルシューティング

### ログ確認
```bash
pm2 logs bizsupport --lines 50
sudo tail -f /var/log/nginx/bizsupport_error.log
```

### アプリが起動しない場合
```bash
cd /var/www/bizsupport
NODE_ENV=production node dist/index.js
# エラーメッセージを確認
```

### Googleログインで 403 エラーが出る場合
- `GOOGLE_CALLBACK_URL` が Google Cloud Console の「承認済みリダイレクトURI」と完全一致しているか確認
- ログインは iframe 内では動作しない。必ず通常のブラウザタブで開くこと

### DB接続エラーが出る場合
- `DATABASE_URL` が正しいか確認
- Neon の接続文字列末尾に `?sslmode=require` があるか確認

---

## 重要ファイル一覧

| ファイル | 用途 |
|---------|------|
| `/var/www/bizsupport/.env` | 環境変数（秘密情報） |
| `/var/www/bizsupport/deploy/ecosystem.config.cjs` | PM2設定 |
| `/etc/nginx/sites-available/bizsupport` | Nginx設定（専用サーバーの場合） |
| `/var/log/nginx/bizsupport_*.log` | Nginxログ |
| `/var/log/pm2/bizsupport-*.log` | アプリログ |
