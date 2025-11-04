# Supabase Storage 設定ガイド

## 概要
Supabase Storageはファイルストレージサービスです。実際のファイルデータを保存します。

## 必要な設定

### 1. アカウント作成

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 2. プロジェクト作成

#### 2.1 新規プロジェクト

1. 「New Project」をクリック
2. Organization: 既存のものを選択、または新規作成
3. プロジェクト設定:
   - **Name**: `litedrive`（任意）
   - **Database Password**: 自動生成（コピー推奨、ただしStorageでは不要）
   - **Region**: `Northeast Asia (Tokyo)` または近い地域
   - **Pricing Plan**: Free
4. 「Create new project」をクリック
5. プロジェクト初期化に約2分待機

### 3. Storage Bucket作成

#### 3.1 Bucketの作成

1. 左サイドバー → **Storage**
2. 「Create a new bucket」をクリック
3. Bucket設定:
   - **Name**: `litedrive`（重要: コードと一致させる）
   - **Public bucket**: ✅ **ONにする**（重要）
   - **File size limit**: 10 MB（推奨）
   - **Allowed MIME types**: 空欄（全て許可）または個別指定
4. 「Create bucket」をクリック

#### 3.2 Public Bucketの確認

作成後、Bucketの設定を確認:

1. `litedrive` Bucketをクリック
2. 右上の「...」メニュー → 「Edit bucket」
3. 「Public bucket」が✅になっていることを確認

⚠️ **重要**: Public bucketでない場合、ファイルダウンロードが認証エラーになります。

### 4. APIキー取得

#### 4.1 Project Settings

1. 左サイドバー下部 → ⚙️ **Settings**
2. 「API」をクリック

#### 4.2 必要な情報

以下をコピー:

1. **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   → `.env.local` の `SUPABASE_URL`

2. **service_role key** (APIキーセクション):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - 「service_role」の「Reveal」をクリック
   - ⚠️ **絶対に公開しない**（サーバーサイドのみで使用）
   - → `.env.local` の `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **注意**: `anon key` ではなく `service_role key` を使用してください。

### 5. CORS設定（通常不要）

Public bucketの場合、CORSは自動設定されますが、問題がある場合:

1. Settings → API → CORS Configuration
2. Allowed origins に以下を追加:
   ```
   http://localhost:5173
   https://your-domain.vercel.app
   ```

### 6. Storage Policies（Public Bucketの場合は不要）

Public bucketを使用しているため、追加のポリシー設定は不要です。

もし非公開bucketを使用する場合（上級）、以下のポリシーが必要:

```sql
-- SELECT (読み取り) - 全ユーザー許可
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'litedrive');

-- INSERT (アップロード) - 認証済みユーザーのみ
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'litedrive' AND
  auth.role() = 'authenticated'
);

-- DELETE (削除) - ファイル所有者のみ
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'litedrive' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 7. 環境変数設定

`.env.local` に追加:

```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ストレージ構造

### ファイルパス形式

```
litedrive/
  └── {userId}/
      ├── {timestamp}_{filename1}
      ├── {timestamp}_{filename2}
      └── ...
```

例:
```
litedrive/user_2abc123/1704945600000_report.pdf
litedrive/user_2abc123/1704945700000_photo.jpg
```

### 公開URL形式

```
https://{project-id}.supabase.co/storage/v1/object/public/litedrive/{userId}/{timestamp}_{filename}
```

## 動作確認

### ブラウザでの確認

1. Supabase Dashboard → Storage → `litedrive` bucket
2. アプリケーションでファイルをアップロード
3. Storageにファイルが表示されることを確認
4. ファイルをクリック → 「Get URL」でURLを取得
5. ブラウザで開いてダウンロード可能か確認

### APIテスト（オプション）

```bash
# アップロードテスト
curl -X POST \
  'https://xxxxx.supabase.co/storage/v1/object/litedrive/test/hello.txt' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: text/plain' \
  --data 'Hello World'

# アクセステスト
curl 'https://xxxxx.supabase.co/storage/v1/object/public/litedrive/test/hello.txt'
```

## トラブルシューティング

### エラー: "Bucket not found"

**原因**: Bucket名が間違っている、または作成されていない

**解決方法**:
1. Supabase Dashboard → Storage
2. `litedrive` という名前のbucketが存在するか確認
3. 存在しない場合は作成
4. コード内のbucket名が `litedrive` と一致するか確認

### エラー: "Access denied" / 403 Forbidden

**原因1**: Public bucketが有効になっていない

**解決方法**:
1. Storage → `litedrive` bucket → Edit bucket
2. 「Public bucket」を✅にする

**原因2**: service_role keyが間違っている

**解決方法**:
1. Settings → API → service_role key を再確認
2. anon keyではなくservice_role keyを使用しているか確認

### エラー: "File size exceeds limit"

**原因**: Bucketのファイルサイズ制限を超えている

**解決方法**:
1. Storage → `litedrive` → Edit bucket
2. File size limit を増やす（例: 50 MB）
3. または、アプリ側で10MB制限を維持

### ファイルがアップロードされない

**原因**: 環境変数が読み込まれていない

**解決方法**:
1. `.env.local` が正しく配置されているか確認
2. 環境変数名が `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` か確認
3. 開発サーバーを再起動

### アップロードは成功するがダウンロードできない

**原因**: Bucketが非公開になっている

**解決方法**:
1. Storage → `litedrive` → Edit bucket
2. 「Public bucket」を✅にする
3. 既存ファイルのパーミッションも更新される

### CORS エラー

**原因**: オリジンが許可されていない

**解決方法**:
1. Settings → API → CORS Configuration
2. ローカル開発用: `http://localhost:5173` を追加
3. 本番用: Vercelドメインを追加

## セキュリティ考慮事項

### 1. Service Role Key の保護

- ⚠️ **絶対にフロントエンドで使用しない**
- ⚠️ **Gitにコミットしない**
- サーバーサイド（Vercel Functions）でのみ使用

### 2. ファイルサイズ制限

Bucket設定で制限を設定:
- 推奨: 10 MB
- 最大: 50 MB（Free tier）

### 3. MIME Type制限（オプション）

悪意のあるファイル形式を制限:

Bucket → Edit bucket → Allowed MIME types:
```
image/jpeg,image/png,image/gif,application/pdf,text/plain
```

### 4. ストレージ使用量の監視

1. Settings → Usage
2. Storage使用量を確認
3. Free tier: 1 GB まで

## データ削除

### 個別ファイル削除

Storage → `litedrive` → ファイルを選択 → Delete

### Bucket削除（プロジェクトリセット時）

Storage → `litedrive` → `...` → Delete bucket

⚠️ **警告**: Bucket削除はすべてのファイルを削除します。

## 料金

### Free Tier制限

- **ストレージ**: 1 GB
- **帯域幅**: 2 GB/月
- **リクエスト**: 無制限

### 制限超過時

- Pro Plan: $25/月
  - ストレージ: 100 GB
  - 帯域幅: 200 GB

LiteDriveの通常使用では無料枠で十分です。

## 参考リンク

- [Supabase Storage公式ドキュメント](https://supabase.com/docs/guides/storage)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)