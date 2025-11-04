# LiteDrive

軽量クラウドストレージアプリケーション

## 機能

- ファイルアップロード（最大10MB）
- ファイル一覧表示
- ファイルダウンロード
- ファイル削除
- Clerk認証（Google/GitHub）

## 技術スタック

- **フロントエンド**: Vue 3 + Vite + Tailwind CSS
- **認証**: Clerk
- **ストレージ**: Supabase Storage
- **データベース**: MongoDB Atlas
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
```

以下の環境変数を設定:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_***
CLERK_SECRET_KEY=sk_test_***
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9***
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/litedrive
```

### 3. 外部サービスの設定

#### Clerk（認証）
1. https://clerk.com でアカウント作成
2. アプリケーションを作成
3. Social Connectionsで Google/GitHub を有効化
4. API Keysを取得

#### Supabase（ストレージ）
1. https://supabase.com でプロジェクト作成
2. Storage → Create Bucket → `litedrive`
3. Bucket を Public に設定
4. Settings → API から URL と service_role key を取得

#### MongoDB Atlas（データベース）
1. https://cloud.mongodb.com でクラスタ作成
2. Database User を作成（読み書き権限）
3. Network Access で `0.0.0.0/0` を許可
4. 接続URIを取得（データベース名: `litedrive`）

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:5173 でアクセス

## デプロイ（Vercel）

### 1. GitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercelでインポート

1. https://vercel.com にアクセス
2. プロジェクトをインポート
3. Framework Preset: `Vite`
4. Environment Variables を設定
5. Deploy

## 改善点

このバージョンでは以下の改善を実施:

### セキュリティ
- ファイルサイズ制限（10MB）
- MIME type検証
- クライアント側・サーバー側の二重チェック

### 信頼性
- トランザクション整合性（ロールバック機能）
- MongoDB接続の適切なクローズ
- 並行削除の防止

### ユーザー体験
- アップロード成功メッセージ
- 削除中の視覚的フィードバック
- エラーメッセージの改善

## ディレクトリ構成

```
litedrive/
├── api/
│   ├── upload.js      # ファイルアップロードAPI
│   ├── list.js        # ファイル一覧取得API
│   └── delete.js      # ファイル削除API
├── src/
│   ├── components/
│   │   ├── FileUploader.vue
│   │   ├── FileList.vue
│   │   └── FileItem.vue
│   ├── pages/
│   │   ├── Home.vue
│   │   └── Login.vue
│   ├── composables/
│   │   └── useAuth.js
│   ├── App.vue
│   ├── main.js
│   └── index.css
├── index.html
├── vercel.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## ライセンス

MIT