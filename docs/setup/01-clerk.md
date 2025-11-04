# Clerk 認証設定ガイド

## 概要
Clerkは認証・ユーザー管理サービスです。Google/GitHub等のソーシャルログインを提供します。

## 必要な設定

### 1. アカウント作成

1. https://clerk.com にアクセス
2. 「Sign up」をクリック
3. メールアドレスで登録またはGitHubでサインアップ

### 2. アプリケーション作成

1. ダッシュボードで「+ Create application」をクリック
2. Application name: `LiteDrive` (任意)
3. 認証方法を選択:
   - ✅ Email
   - ✅ Google
   - ✅ GitHub
4. 「Create application」をクリック

### 3. APIキー取得

作成後、自動的にQuickstartページに遷移します。

#### 取得するキー

1. **Publishable Key** (公開キー)
   - 画面上部に表示: `pk_test_...` または `pk_live_...`
   - フロントエンドで使用
   - → `.env.local` の `VITE_CLERK_PUBLISHABLE_KEY`

2. **Secret Key** (秘密キー)
   - 画面中央の「API Keys」タブをクリック
   - 「Secret keys」セクションで `sk_test_...` を表示
   - ⚠️ **絶対に公開しない**
   - → `.env.local` の `CLERK_SECRET_KEY`

### 4. ソーシャルログイン設定

#### Google認証

1. 左サイドバー → **Configure** → **SSO Connections**
2. **Google** を探して「Configure」
3. デフォルト設定のまま「Save」
   - Clerkが自動的にOAuth設定を管理

#### GitHub認証

1. 同じく **SSO Connections**
2. **GitHub** を探して「Configure」
3. デフォルト設定のまま「Save」

### 5. 許可ドメイン設定（本番環境）

開発環境では `localhost` が自動許可されていますが、本番デプロイ時に設定が必要です。

1. 左サイドバー → **Configure** → **Domains**
2. 「Add domain」をクリック
3. Vercelのドメインを入力（例: `litedrive.vercel.app`）
4. 「Add domain」をクリック

### 6. 環境変数設定

`.env.local` に以下を追加:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 動作確認

### フロントエンド

```bash
npm run dev
```

1. http://localhost:5173 にアクセス
2. 「ログイン」ボタンをクリック
3. Clerkのログインモーダルが表示されることを確認
4. Google または GitHub でログイン
5. 成功後、Homeページに遷移することを確認

### 確認項目

- [ ] ログインモーダルが表示される
- [ ] Google認証が動作する
- [ ] GitHub認証が動作する
- [ ] ログイン後、ユーザー情報（メールアドレス）が表示される
- [ ] ログアウトが動作する

## トラブルシューティング

### エラー: "Clerk: Missing publishable key"

**原因**: 環境変数が読み込まれていない

**解決方法**:
1. `.env.local` ファイルが存在するか確認
2. ファイル名が正確か確認（`.env.local.txt` などになっていないか）
3. 開発サーバーを再起動: `npm run dev`

### エラー: "Invalid publishable key"

**原因**: キーが間違っている

**解決方法**:
1. Clerkダッシュボードで正しいキーをコピー
2. `pk_test_` または `pk_live_` で始まることを確認
3. 余分なスペースや改行がないか確認

### Google/GitHubログインボタンが表示されない

**原因**: SSO Connectionsが有効化されていない

**解決方法**:
1. Clerk Dashboard → Configure → SSO Connections
2. Google と GitHub を確認
3. それぞれ「Enable」になっているか確認
4. 無効の場合、クリックして有効化

### 本番環境でログインできない

**原因**: ドメインが許可されていない

**解決方法**:
1. Clerk Dashboard → Configure → Domains
2. Vercelのデプロイ先ドメインを追加
3. 数分待ってから再試行

## セキュリティ推奨設定

### 1. Session設定

Clerk Dashboard → Configure → Sessions

- **Session lifetime**: 7 days（推奨）
- **Inactive session lifetime**: 30 minutes（推奨）
- **Require multi-factor authentication**: オプション

### 2. 本番環境への移行

開発が完了したら、本番環境キーに切り替え:

1. Clerk Dashboard → **Settings** → **API Keys**
2. 環境を「Production」に切り替え
3. 本番用のキー（`pk_live_...`, `sk_live_...`）を取得
4. Vercelの環境変数を更新

## 料金

- **Free tier**: 月間10,000 MAU（Monthly Active Users）まで無料
- LiteDriveの規模では通常無料枠内で運用可能

## 参考リンク

- [Clerk公式ドキュメント](https://clerk.com/docs)
- [Vue.js統合ガイド](https://clerk.com/docs/references/javascript/overview)
- [SSO設定](https://clerk.com/docs/authentication/social-connections/overview)