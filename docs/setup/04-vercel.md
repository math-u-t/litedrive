# Vercel デプロイ設定ガイド

## 概要
Vercelはフロントエンドとサーバーレス関数をホスティングするプラットフォームです。

## 必要な設定

### 1. アカウント作成

1. https://vercel.com にアクセス
2. 「Sign Up」をクリック
3. **GitHubアカウントでサインアップ**（推奨）
   - GitHubとの連携が必要なため

### 2. GitHubリポジトリ作成

#### 2.1 ローカルでGit初期化

```bash
cd litedrive
git init
git add .
git commit -m "Initial commit: LiteDrive implementation"
```

#### 2.2 GitHubにプッシュ

1. GitHubで新規リポジトリ作成: https://github.com/new
   - Repository name: `litedrive`
   - Visibility: Private（推奨）
   - ❌ README, .gitignore, license は追加しない

2. ローカルからプッシュ:
```bash
git remote add origin https://github.com/YOUR_USERNAME/litedrive.git
git branch -M main
git push -u origin main
```

### 3. Vercelプロジェクト作成

#### 3.1 リポジトリインポート

1. Vercel Dashboard → 「Add New...」 → 「Project」
2. 「Import Git Repository」
3. GitHubリポジトリ `litedrive` を選択
4. 「Import」をクリック

#### 3.2 プロジェクト設定

**Configure Project** 画面で以下を設定:

- **Framework Preset**: `Vite`（自動検出される）
- **Root Directory**: `.`（デフォルト）
- **Build Command**: `npm run build`（自動）
- **Output Directory**: `dist`（自動）

### 4. 環境変数設定

「Environment Variables」セクションで以下を追加:

```bash
# Clerk認証
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx

# Supabase Storage
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/litedrive
```

**設定方法**:
1. Name: `VITE_CLERK_PUBLISHABLE_KEY`
2. Value: 実際の値を貼り付け
3. Environment: **Production**, **Preview**, **Development** 全てチェック
4. 「Add」をクリック
5. 上記を全ての環境変数について繰り返す

### 5. デプロイ実行

1. 「Deploy」ボタンをクリック
2. ビルドログを確認（約1-2分）
3. 成功すると「Congratulations!」画面が表示される
4. 「Visit」ボタンでサイトを確認

### 6. カスタムドメイン設定（オプション）

#### 6.1 Vercel提供ドメイン

デフォルトで以下が付与されます:
```
https://litedrive.vercel.app
https://litedrive-xxxxx.vercel.app
```

#### 6.2 独自ドメイン追加

1. Project Settings → Domains
2. 「Add」をクリック
3. ドメイン名を入力（例: `litedrive.com`）
4. DNSレコードを設定:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. 検証完了後、HTTPSが自動設定される

### 7. Clerk許可ドメイン追加

Vercelドメインが決定したら、Clerkに登録:

1. Clerk Dashboard → Configure → Domains
2. 「Add domain」をクリック
3. Vercelドメインを入力: `litedrive.vercel.app`
4. 「Add domain」をクリック

### 8. 継続的デプロイ設定

Vercelは自動的にGitHubと連携し、以下のタイミングでデプロイされます:

- `main` ブランチへのpush → **本番デプロイ**
- Pull Requestの作成 → **プレビューデプロイ**

## 動作確認

### 1. 基本機能

- [ ] サイトにアクセスできる
- [ ] ログイン画面が表示される
- [ ] Clerkでログインできる
- [ ] ファイルアップロードが動作する
- [ ] ファイル一覧が表示される
- [ ] ファイルダウンロードが動作する
- [ ] ファイル削除が動作する

### 2. API Functions

Vercel Functions（`/api/*`）が正常動作しているか確認:

```bash
# ブラウザDevTools → Networkタブで確認
# または curlでテスト

curl https://litedrive.vercel.app/api/list?userId=test_user_id
```

## トラブルシューティング

### ビルドエラー: "Command failed"

**原因**: 依存関係のインストール失敗

**解決方法**:
1. Deploymentログを確認
2. `package.json` の依存関係を確認
3. ローカルで `npm install` が成功するか確認
4. `package-lock.json` をコミット

### エラー: "Environment variable not found"

**原因**: 環境変数が設定されていない

**解決方法**:
1. Project Settings → Environment Variables
2. 必要な変数が全て追加されているか確認
3. 値が正確か確認
4. Redeploy

### API Functions が 404

**原因**: `vercel.json` の設定問題

**解決方法**:
1. `vercel.json` が存在するか確認
2. ルーティング設定を確認:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```
3. 再デプロイ

### Clerk認証エラー

**原因**: Vercelドメインが許可されていない

**解決方法**:
1. Clerk Dashboard → Configure → Domains
2. Vercelの実際のドメインを追加
3. プレビューデプロイの場合、各プレビューURLを個別に追加が必要（または wildcard使用）

### MongoDB接続エラー

**原因**: 環境変数の形式が間違っている

**解決方法**:
1. MongoDB URI に特殊文字（`@`, `/`, `?` など）が含まれる場合、URLエンコードが必要:
```bash
# パスワードに @ が含まれる場合
password: p@ssw0rd
エンコード後: p%40ssw0rd
```
2. Environment Variables で再設定
3. Redeploy

### ファイルアップロードが遅い

**原因**: Vercel Functionsのタイムアウト（10秒）

**解決方法**:
1. `vercel.json` で制限時間を延長:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```
⚠️ Hobby planは最大10秒、Pro planは最大60秒

### デプロイ後、変更が反映されない

**原因**: ブラウザキャッシュ

**解決方法**:
1. ブラウザでスーパーリロード: `Ctrl + Shift + R` (Win) / `Cmd + Shift + R` (Mac)
2. Vercel Dashboard → Deployments で最新デプロイが成功しているか確認
3. キャッシュクリア

## セキュリティ設定

### 1. 環境変数の保護

- ✅ `VITE_*` プレフィックス付きのみクライアントに露出される
- ✅ それ以外はサーバーサイドのみで利用可能
- ❌ シークレットキーを `VITE_` で始めない

### 2. CORS設定（通常不要）

VercelとSupabaseは自動的にCORS対応。

### 3. レート制限（Pro plan）

悪用防止のためAPI制限を設定:

1. Project Settings → Environment
2. Edge Config でレート制限を設定（Pro planのみ）

## パフォーマンス最適化

### 1. Edge Functions（オプション）

グローバル配信を高速化:

`vercel.json`:
```json
{
  "functions": {
    "api/list.js": {
      "memory": 1024,
      "maxDuration": 10,
      "regions": ["sin1", "nrt1"]
    }
  }
}
```

### 2. 静的ファイルキャッシュ

Vercelは自動的にビルド成果物をCDNでキャッシュ。

### 3. イメージ最適化（将来的）

Vercel Image Optimizationを活用:
```javascript
import Image from 'next/image' // Next.js使用時
```

## モニタリング

### 1. アナリティクス（Pro plan）

Project → Analytics で確認:
- ページビュー
- リクエスト数
- レスポンスタイム

### 2. ログ確認

Project → Deployments → 特定のデプロイ → View Function Logs

### 3. エラー追跡

Vercel ⚡ Speed Insights / Vercel Analytics で追跡可能（Pro plan）

## 料金

### Hobby Plan（無料）
- 帯域幅: 100 GB/月
- ビルド時間: 100時間/月
- Functions実行時間: 100 GB-Hours/月
- **LiteDriveでは十分**

### Pro Plan（$20/月）
- 帯域幅: 1 TB/月
- Functions maxDuration: 60秒
- Analytics付き

## 更新デプロイ

コード変更後:

```bash
git add .
git commit -m "Update: feature description"
git push origin main
```

自動的にVercelがビルド・デプロイを開始します。

## ロールバック

問題のあるデプロイをロールバック:

1. Deployments → 正常なデプロイを選択
2. 「...」メニュー → 「Promote to Production」

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)