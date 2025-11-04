# LiteDrive クイックスタートガイド

## 前提条件

- Node.js 18以上
- npm または yarn
- GitHubアカウント
- 各種サービスのアカウント（無料）:
  - Clerk
  - MongoDB Atlas
  - Supabase
  - Vercel

---

## 5ステップで起動

### ステップ1: プロジェクトのセットアップ（5分）

```bash
# 1. プロジェクトディレクトリ作成
mkdir litedrive
cd litedrive

# 2. ファイル配置
# アーティファクトの全ファイルを配置

# 3. 依存関係インストール
npm install

# 4. 環境変数ファイル作成
cp .env.example .env.local
```

### ステップ2: Clerk設定（5分）

1. https://clerk.com でサインアップ
2. アプリケーション作成
3. Google/GitHub認証を有効化
4. API Keysをコピー:
   - `pk_test_...` → `.env.local` の `VITE_CLERK_PUBLISHABLE_KEY`
   - `sk_test_...` → `.env.local` の `CLERK_SECRET_KEY`

詳細: [Clerk設定ガイド](./setup/01-clerk.md)

### ステップ3: MongoDB設定（5分）

1. https://cloud.mongodb.com でサインアップ
2. M0 Free クラスタ作成（東京リージョン推奨）
3. Database User作成
4. Network Access で `0.0.0.0/0` を許可
5. 接続URI取得 → `.env.local` の `MONGODB_URI`

詳細: [MongoDB設定ガイド](./setup/02-mongodb.md)

### ステップ4: Supabase設定（5分）

1. https://supabase.com でサインアップ
2. プロジェクト作成
3. Storage → `litedrive` bucket作成（Public✅）
4. Settings → API から取得:
   - Project URL → `.env.local` の `SUPABASE_URL`
   - service_role key → `.env.local` の `SUPABASE_SERVICE_ROLE_KEY`

詳細: [Supabase設定ガイド](./setup/03-supabase.md)

### ステップ5: 起動（1分）

```bash
npm run dev
```

http://localhost:5173 にアクセス

---

## 最終的な .env.local

```bash
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxx

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/litedrive?retryWrites=true&w=majority
```

---

## 動作確認チェックリスト

ローカル開発環境で以下を確認:

- [ ] http://localhost:5173 にアクセスできる
- [ ] ログイン画面が表示される
- [ ] Google/GitHubでログインできる
- [ ] ログイン後、Homeページに遷移する
- [ ] ファイルアップロードできる（10MB以下のファイル）
- [ ] アップロード後、ファイル一覧に表示される
- [ ] ダウンロードボタンでファイルをダウンロードできる
- [ ] 削除ボタンでファイルを削除できる
- [ ] ログアウトできる

---

## 本番デプロイ（オプション）

### 準備

```bash
# Gitリポジトリ初期化
git init
git add .
git commit -m "Initial commit"

# GitHubにプッシュ
# GitHubで新規リポジトリ作成後:
git remote add origin https://github.com/YOUR_USERNAME/litedrive.git
git push -u origin main
```

### Vercelデプロイ

1. https://vercel.com でサインアップ
2. Import Git Repository
3. `litedrive` リポジトリを選択
4. Framework Preset: `Vite`
5. Environment Variables に `.env.local` の内容を全てコピー
6. Deploy

詳細: [Vercelデプロイガイド](./setup/04-vercel.md)

### デプロイ後の設定

1. **Clerkドメイン許可**:
   - Clerk Dashboard → Domains
   - Vercelドメイン（例: `litedrive.vercel.app`）を追加

2. **動作確認**:
   - デプロイURLにアクセス
   - ログイン〜ファイル操作の全機能をテスト

---

## トラブルシューティング

### ログインできない

**確認事項**:
1. `.env.local` の `VITE_CLERK_PUBLISHABLE_KEY` が正しいか
2. Clerk Dashboard で Google/GitHub が有効か
3. 開発サーバーを再起動したか

### ファイルアップロードできない

**確認事項**:
1. ファイルサイズは10MB以下か
2. `.env.local` の全環境変数が正しいか
3. ブラウザDevTools → Consoleでエラー確認

### ファイル一覧が表示されない

**確認事項**:
1. MongoDB Atlas → Network Access で `0.0.0.0/0` が許可されているか
2. MongoDB URIのデータベース名が `litedrive` か
3. ブラウザDevTools → Network → `/api/list` のレスポンス確認

詳細: [トラブルシューティングガイド](./troubleshooting.md)

---

## 次のステップ

1. **カスタマイズ**:
   - ファイルサイズ制限変更
   - 許可するMIMEタイプ追加
   - UIテーマ変更

2. **機能追加**:
   - フォルダ機能
   - ファイル検索
   - ファイル共有

3. **本番運用**:
   - カスタムドメイン設定
   - バックアップ設定
   - モニタリング設定

---

## ドキュメント一覧

- [Clerk設定](./setup/01-clerk.md)
- [MongoDB設定](./setup/02-mongodb.md)
- [Supabase設定](./setup/03-supabase.md)
- [Vercelデプロイ](./setup/04-vercel.md)
- [トラブルシューティング](./troubleshooting.md)
- [API リファレンス](./api-reference.md)

---

## サポート

問題が発生した場合:

1. [トラブルシューティングガイド](./troubleshooting.md)を確認
2. ブラウザDevToolsでエラー確認
3. 各サービスのログ確認:
   - Vercel Functions ログ
   - MongoDB Atlas メトリクス
   - Supabase ログ

---

## 推定時間

| 作業 | 時間 |
|------|------|
| プロジェクトセットアップ | 5分 |
| Clerk設定 | 5分 |
| MongoDB設定 | 5分 |
| Supabase設定 | 5分 |
| 起動・動作確認 | 5分 |
| **合計** | **約25分** |

本番デプロイ含めても **30-40分** で完了します。

---

## よくある質問

### Q: 無料で運用できますか？

A: はい。すべて無料プランで運用可能です:
- Clerk: 10,000 MAU/月まで無料
- MongoDB Atlas: 512MB まで無料
- Supabase: 1GB ストレージ + 2GB 帯域幅/月
- Vercel: 100GB 帯域幅/月

通常の個人使用では十分です。

### Q: データは安全ですか？

A: はい。以下のセキュリティ対策を実施:
- Clerk による認証
- MongoDB/Supabase の暗号化通信
- Service Role Key による API保護
- ユーザー別のアクセス制御

### Q: ファイルサイズの制限はなぜ10MBですか？

A: Vercel Functionsのペイロード制限とレスポンス時間を考慮しています。必要に応じて変更可能ですが、50MB以上は推奨しません。

### Q: 商用利用できますか？

A: コード自体はMITライセンスですが、各サービスの利用規約を確認してください。商用利用時は有料プランへのアップグレードが必要になる場合があります。