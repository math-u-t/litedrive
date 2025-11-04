# LiteDrive トラブルシューティングガイド

## 目次

1. [認証エラー](#認証エラー)
2. [アップロードエラー](#アップロードエラー)
3. [ダウンロードエラー](#ダウンロードエラー)
4. [削除エラー](#削除エラー)
5. [表示エラー](#表示エラー)
6. [デプロイエラー](#デプロイエラー)
7. [パフォーマンス問題](#パフォーマンス問題)
8. [データ整合性問題](#データ整合性問題)

---

## 認証エラー

### 問題: ログインボタンを押しても何も起こらない

**症状**:
- ログインボタンクリック後、反応なし
- コンソールにエラーなし

**原因**:
- Clerk SDK の初期化失敗
- Publishable Key が間違っている

**解決方法**:

1. ブラウザDevTools → Console でエラー確認
2. 環境変数確認:
```bash
# .env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```
3. キーが `pk_test_` または `pk_live_` で始まることを確認
4. 開発サーバー再起動: `npm run dev`

**検証**:
```javascript
// ブラウザConsoleで確認
console.log(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
// undefined なら環境変数が読み込まれていない
```

### 問題: "Clerk: Invalid publishable key"

**原因**:
- キーの形式が間違っている
- 環境が一致していない（test/live）

**解決方法**:

1. Clerk Dashboard → API Keys
2. 正しいキーをコピー（先頭・末尾のスペースに注意）
3. `.env.local` を更新
4. サーバー再起動

### 問題: Google/GitHubログインが表示されない

**原因**:
- Clerk Dashboard で SSO Connections が無効

**解決方法**:

1. Clerk Dashboard → Configure → SSO Connections
2. Google → Enable
3. GitHub → Enable
4. ブラウザをリロード

### 問題: 本番環境でログインできない

**原因**:
- Vercelドメインが許可されていない

**解決方法**:

1. Clerk Dashboard → Configure → Domains
2. 「Add domain」
3. Vercelドメインを追加: `your-app.vercel.app`
4. 5分待機後、再試行

---

## アップロードエラー

### 問題: "File too large (max 10MB)"

**症状**:
- アップロード時にエラーメッセージ表示

**原因**:
- ファイルサイズが制限を超えている

**解決方法**:

1. ファイルサイズを確認
2. 10MB以下に圧縮
3. または、制限を変更:

```javascript
// api/upload.js
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MBに変更
```

```javascript
// src/components/FileUploader.vue
const MAX_SIZE = 50 * 1024 * 1024 // 50MB
```

### 問題: "Unsupported file type"

**原因**:
- 許可されていないMIME type

**解決方法**:

MIME typeを追加:

```javascript
// api/upload.js
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/zip',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav',
  // 追加したいMIME typeをここに
  'application/vnd.ms-excel' // Excelなど
];
```

### 問題: "Upload to storage failed"

**症状**:
- アップロード中に失敗
- コンソールに "Supabase upload error"

**原因**:
1. Supabase Service Role Key が間違っている
2. Supabase Bucket が存在しない
3. Supabase Bucket が非公開

**解決方法**:

1. 環境変数確認:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

2. Supabase Dashboard → Storage
   - `litedrive` bucket が存在するか確認
   - Bucket → Edit → 「Public bucket」が✅になっているか確認

3. Service Role Key を再取得:
   - Settings → API → service_role key → Reveal
   - **anon key ではなく service_role key を使用**

### 問題: "Database error"

**症状**:
- アップロードは成功するが、ファイル一覧に表示されない
- コンソールに "MongoDB error"

**原因**:
- MongoDB接続失敗
- 接続URIが間違っている

**解決方法**:

1. MongoDB接続URI確認:
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/litedrive?retryWrites=true&w=majority
```

2. MongoDB Atlas → Network Access
   - `0.0.0.0/0` が許可されているか確認

3. 接続テスト:
```bash
# Node.jsで直接テスト
node -e "import('mongodb').then(m => new m.MongoClient('YOUR_URI').connect().then(() => console.log('OK')))"
```

### 問題: アップロード中にページがフリーズ

**原因**:
- 大きいファイルのBase64変換でメモリ不足

**解決方法**:

1. ファイルサイズ制限を厳しくする（10MB以下推奨）
2. ブラウザを再起動
3. 別のブラウザで試す

---

## ダウンロードエラー

### 問題: "Access denied" / ファイルが開けない

**症状**:
- ダウンロードリンクをクリックすると403エラー

**原因**:
- Supabase Bucket が非公開

**解決方法**:

1. Supabase Dashboard → Storage → `litedrive`
2. 右上 `...` → Edit bucket
3. 「Public bucket」を✅にする
4. Save

### 問題: ダウンロードURLが404

**症状**:
- URLは生成されるが、アクセスすると404

**原因**:
- ファイルがSupabaseから削除されている
- URLの形式が間違っている

**解決方法**:

1. URL形式確認:
```
正: https://xxxxx.supabase.co/storage/v1/object/public/litedrive/user_xxx/123_file.pdf
誤: https://xxxxx.supabase.co/storage/litedrive/user_xxx/123_file.pdf
```

2. Supabase Dashboard → Storage → `litedrive`
   - ファイルが実際に存在するか確認

3. MongoDBとSupabaseの整合性確認:
```javascript
// api/list.js でURLを再生成
const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/litedrive/${file.storagePath}`;
```

---

## 削除エラー

### 問題: "File not found"

**原因**:
- ファイルが既に削除されている
- 別のユーザーのファイル

**解決方法**:

1. ページをリロードしてファイル一覧を更新
2. ログアウト→ログインで認証状態をリセット

### 問題: 削除ボタンを押しても削除されない

**症状**:
- 削除確認ダイアログは出るが、ファイルが残る

**原因**:
- API呼び出し失敗
- ネットワークエラー

**解決方法**:

1. ブラウザDevTools → Network タブ
2. `/api/delete` リクエストを確認
3. レスポンスのエラーメッセージを確認

4. MongoDB接続確認:
```bash
# MongoDB Atlas → Network Access
# 接続元IPが許可されているか
```

### 問題: 削除後もSupabaseにファイルが残る

**症状**:
- ファイル一覧からは消えるが、Supabase Storageには残る

**原因**:
- Supabase削除の失敗（ただし、これは設計上問題なし）

**影響**:
- ストレージ容量が圧迫される
- セキュリティ上の問題はない（DBから削除されているため）

**解決方法**:

手動削除:
1. Supabase Dashboard → Storage → `litedrive`
2. 不要なファイルを手動削除

自動クリーンアップ（上級）:
```javascript
// 定期実行スクリプト（例: Vercel Cron Jobs）
// DBに存在しないSupabaseファイルを削除
```

---

## 表示エラー

### 問題: ファイル一覧が表示されない

**症状**:
- "読み込み中..." が永遠に表示される

**原因**:
- API呼び出し失敗
- MongoDB接続エラー

**解決方法**:

1. ブラウザDevTools → Network → `/api/list`
2. レスポンスを確認:
```json
{
  "error": "Internal server error"
}
```

3. Vercel Functions ログ確認（本番環境）:
   - Vercel Dashboard → Deployments → Functions
   - エラーログを確認

4. 環境変数確認:
```bash
MONGODB_URI=mongodb+srv://...
```

### 問題: ファイル名が文字化けする

**症状**:
- 日本語ファイル名が正しく表示されない

**原因**:
- エンコーディング問題

**解決方法**:

現在の実装では問題ないはずですが、もし発生した場合:

```javascript
// api/upload.js
const fileName = decodeURIComponent(req.body.fileName);
```

### 問題: アイコンが表示されない

**症状**:
- Material Icons が表示されず、テキストになる

**原因**:
- Google Fonts CDN読み込み失敗

**解決方法**:

1. `index.html` 確認:
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

2. ネットワーク接続確認
3. ブラウザキャッシュクリア

---

## デプロイエラー

### 問題: Vercel Build失敗

**症状**:
```
Error: Command "npm run build" exited with 1
```

**原因**:
- 依存関係の問題
- TypeScriptエラー
- 環境変数不足

**解決方法**:

1. ローカルでビルド確認:
```bash
npm install
npm run build
```

2. エラーメッセージを確認して修正

3. `package-lock.json` をコミット:
```bash
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### 問題: Functions Timeout

**症状**:
```
Error: Task timed out after 10.00 seconds
```

**原因**:
- アップロード処理が10秒を超えている

**解決方法**:

`vercel.json` で制限延長:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

⚠️ Hobby planは最大10秒まで

---

## パフォーマンス問題

### 問題: アップロードが遅い

**原因**:
- ファイルサイズが大きい
- ネットワーク速度が遅い
- Base64変換のオーバーヘッド

**解決方法**:

1. ファイルサイズを小さくする
2. 画像の場合、事前に圧縮
3. ネットワーク接続を確認

### 問題: ファイル一覧の読み込みが遅い

**原因**:
- ファイル数が多い
- MongoDB接続が遅い

**解決方法**:

1. MongoDB Atlas リージョンを近く変更
2. インデックス作成:

MongoDB Atlas → Browse Collections → `files` → Indexes → Create Index:
```json
{
  "userId": 1,
  "createdAt": -1
}
```

3. ページネーション実装（将来的）

---

## データ整合性問題

### 問題: Supabaseにファイルがあるが、DBにない

**症状**:
- Storage には存在するが、アプリに表示されない

**原因**:
- アップロード中にMongoDB挿入が失敗した

**解決方法**:

手動でMongoDB にドキュメント追加:

```javascript
// MongoDB Compass または Atlas UI で
db.files.insertOne({
  userId: "user_xxxxx",
  fileName: "example.pdf",
  storagePath: "user_xxxxx/1234567890_example.pdf",
  fileSize: 1024000,
  mimeType: "application/pdf",
  url: "https://xxxxx.supabase.co/storage/v1/object/public/litedrive/user_xxxxx/1234567890_example.pdf",
  createdAt: new Date()
})
```

### 問題: MongoDBにドキュメントがあるが、Supabaseにファイルがない

**症状**:
- ファイル一覧に表示されるが、ダウンロードすると404

**原因**:
- Supabaseアップロードが失敗したが、MongoDB挿入は成功した（改善版では発生しないはず）

**解決方法**:

1. 該当ドキュメントをMongoDBから削除:
```javascript
db.files.deleteOne({ _id: ObjectId("...") })
```

2. または、ファイルを再アップロード

---

## デバッグ方法

### ローカル開発

1. **Console ログ**:
```javascript
console.log('Debug:', variable)
```

2. **Network タブ**:
   - DevTools → Network
   - API呼び出しを確認
   - Payload と Response を確認

3. **Vue DevTools**:
   - ブラウザ拡張機能インストール
   - コンポーネントの状態を確認

### 本番環境

1. **Vercel Functions ログ**:
   - Vercel Dashboard → Deployments
   - 特定のデプロイ → View Function Logs

2. **MongoDB Atlas ログ**:
   - Cluster → Metrics
   - 接続数、クエリ数を確認

3. **Supabase ログ**:
   - Settings → Logs
   - Storage アクセスログ確認

---

## 緊急時対応

### データベース全削除（リセット）

```javascript
// MongoDB Atlas → Browse Collections
db.files.deleteMany({})
```

### Storage全削除

Supabase Dashboard → Storage → `litedrive` → すべて選択 → Delete

### 環境完全リセット

1. Vercel → Settings → Delete Project
2. MongoDB Atlas → Cluster → Delete
3. Supabase → Settings → Delete Project
4. Clerk → Settings → Delete Application
5. 最初から再設定

---

## サポート情報収集

問題報告時に以下を提供:

```
1. エラーメッセージ（完全なスタックトレース）
2. 再現手順
3. 環境情報:
   - OS: 
   - ブラウザ: 
   - Node.js version: 
   - 発生環境（ローカル/本番）
4. 関連ログ:
   - ブラウザConsole
   - Vercel Functions ログ
   - Network タブのスクリーンショット
```