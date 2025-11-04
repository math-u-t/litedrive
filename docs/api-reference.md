# LiteDrive API リファレンス

## 概要

LiteDriveは3つのRESTful APIエンドポイントを提供します。

- **Base URL**: `https://your-domain.vercel.app/api`
- **認証**: Clerk userId による認証
- **データ形式**: JSON
- **文字エンコーディング**: UTF-8

---

## エンドポイント一覧

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/upload` | POST | ファイルアップロード |
| `/api/list` | GET | ファイル一覧取得 |
| `/api/delete` | DELETE | ファイル削除 |

---

## 1. ファイルアップロード

### `POST /api/upload`

ファイルをSupabase Storageにアップロードし、メタデータをMongoDBに保存します。

#### リクエスト

**Headers**:
```http
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "fileName": "example.pdf",
  "fileData": "JVBERi0xLjQKJeLjz9MK...",
  "userId": "user_2abc123xyz",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

**パラメータ詳細**:

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `fileName` | string | ✅ | ファイル名（拡張子含む） |
| `fileData` | string | ✅ | Base64エンコードされたファイルデータ |
| `userId` | string | ✅ | ClerkユーザーID |
| `fileSize` | number | ⚠️ | ファイルサイズ（バイト）、推奨 |
| `mimeType` | string | ⚠️ | MIMEタイプ、推奨 |

#### レスポンス

**成功** (200 OK):
```json
{
  "success": true,
  "url": "https://xxxxx.supabase.co/storage/v1/object/public/litedrive/user_2abc123xyz/1704945600000_example.pdf",
  "fileName": "example.pdf"
}
```

**エラー** (400 Bad Request):
```json
{
  "error": "Missing required fields"
}
```

**エラー** (413 Payload Too Large):
```json
{
  "error": "File too large (max 10MB)"
}
```

**エラー** (415 Unsupported Media Type):
```json
{
  "error": "Unsupported file type"
}
```

**エラー** (500 Internal Server Error):
```json
{
  "error": "Upload to storage failed"
}
// または
{
  "error": "Database error"
}
// または
{
  "error": "Internal server error"
}
```

#### 制約

- **ファイルサイズ**: 最大 10MB
- **許可されたMIMEタイプ**:
  ```
  image/jpeg, image/png, image/gif, image/webp
  application/pdf
  text/plain, text/csv
  application/zip
  video/mp4, video/webm
  audio/mpeg, audio/wav
  ```

#### 処理フロー

```
1. 入力バリデーション
   ↓
2. Base64デコード
   ↓
3. Supabase Storageにアップロード
   ↓ (失敗時)
4. MongoDBにメタデータ保存 → ロールバック（Supabase削除）
   ↓ (成功)
5. レスポンス返却
```

#### 使用例

**JavaScript (fetch)**:
```javascript
const file = document.querySelector('input[type="file"]').files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64Data = reader.result.split(',')[1];
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileData: base64Data,
      userId: 'user_2abc123xyz',
      fileSize: file.size,
      mimeType: file.type
    })
  });
  
  const result = await response.json();
  console.log(result);
};

reader.readAsDataURL(file);
```

**cURL**:
```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "fileData": "SGVsbG8gV29ybGQ=",
    "userId": "user_123",
    "fileSize": 11,
    "mimeType": "text/plain"
  }'
```

---

## 2. ファイル一覧取得

### `GET /api/list`

指定ユーザーのファイル一覧を取得します。

#### リクエスト

**URL Parameters**:
```
/api/list?userId=user_2abc123xyz
```

**パラメータ詳細**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `userId` | string | ✅ | ClerkユーザーID |

#### レスポンス

**成功** (200 OK):
```json
[
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "user_2abc123xyz",
    "fileName": "example.pdf",
    "storagePath": "user_2abc123xyz/1704945600000_example.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "url": "https://xxxxx.supabase.co/storage/v1/object/public/litedrive/user_2abc123xyz/1704945600000_example.pdf",
    "createdAt": "2025-01-11T03:20:00.000Z"
  },
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
    "userId": "user_2abc123xyz",
    "fileName": "photo.jpg",
    "storagePath": "user_2abc123xyz/1704946000000_photo.jpg",
    "fileSize": 2048000,
    "mimeType": "image/jpeg",
    "url": "https://xxxxx.supabase.co/storage/v1/object/public/litedrive/user_2abc123xyz/1704946000000_photo.jpg",
    "createdAt": "2025-01-11T03:26:40.000Z"
  }
]
```

**空の場合**:
```json
[]
```

**エラー** (400 Bad Request):
```json
{
  "error": "userId is required"
}
```

**エラー** (500 Internal Server Error):
```json
{
  "error": "Internal server error"
}
```

#### ソート順

- `createdAt` 降順（新しい順）

#### 使用例

**JavaScript (fetch)**:
```javascript
const userId = 'user_2abc123xyz';

const response = await fetch(`/api/list?userId=${userId}`);
const files = await response.json();

console.log(`取得ファイル数: ${files.length}`);
files.forEach(file => {
  console.log(`- ${file.fileName} (${file.fileSize} bytes)`);
});
```

**cURL**:
```bash
curl "https://your-app.vercel.app/api/list?userId=user_123"
```

---

## 3. ファイル削除

### `DELETE /api/delete`

ファイルをMongoDBとSupabase Storageから削除します。

#### リクエスト

**Headers**:
```http
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "fileId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "userId": "user_2abc123xyz"
}
```

**パラメータ詳細**:

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `fileId` | string | ✅ | MongoDBドキュメントID |
| `userId` | string | ✅ | ClerkユーザーID（認証用） |

#### レスポンス

**成功** (200 OK):
```json
{
  "success": true
}
```

**エラー** (400 Bad Request):
```json
{
  "error": "Missing required fields"
}
```

**エラー** (404 Not Found):
```json
{
  "error": "File not found"
}
```

**エラー** (500 Internal Server Error):
```json
{
  "error": "Delete failed"
}
// または
{
  "error": "Internal server error"
}
```

#### 処理フロー

```
1. 入力バリデーション
   ↓
2. MongoDBでファイル存在確認（userId照合）
   ↓ (存在しない場合)
3. 404エラー
   ↓ (存在する場合)
4. MongoDBからドキュメント削除
   ↓
5. Supabase Storageからファイル削除（ベストエフォート）
   ↓
6. レスポンス返却
```

**注意**: Supabase削除が失敗してもエラーにはなりません（孤立ファイルとなりますが、アプリからはアクセス不可）。

#### 使用例

**JavaScript (fetch)**:
```javascript
const fileId = '65a1b2c3d4e5f6a7b8c9d0e1';
const userId = 'user_2abc123xyz';

const response = await fetch('/api/delete', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileId,
    userId
  })
});

const result = await response.json();
if (result.success) {
  console.log('削除成功');
}
```

**cURL**:
```bash
curl -X DELETE https://your-app.vercel.app/api/delete \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "user_123"
  }'
```

---

## エラーハンドリング

### HTTPステータスコード

| コード | 意味 | 説明 |
|-------|------|------|
| 200 | OK | 成功 |
| 400 | Bad Request | リクエストパラメータ不正 |
| 404 | Not Found | リソースが見つからない |
| 405 | Method Not Allowed | HTTPメソッドが許可されていない |
| 413 | Payload Too Large | ファイルサイズ超過 |
| 415 | Unsupported Media Type | MIMEタイプ不許可 |
| 500 | Internal Server Error | サーバー内部エラー |

### エラーレスポンス形式

すべてのエラーは以下の形式:

```json
{
  "error": "エラーメッセージ"
}
```

### クライアント側エラーハンドリング例

```javascript
async function uploadFile(file, userId) {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data,
        userId,
        fileSize: file.size,
        mimeType: file.type
      })
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          alert('入力が不正です');
          break;
        case 413:
          alert('ファイルが大きすぎます（最大10MB）');
          break;
        case 415:
          alert('このファイル形式はサポートされていません');
          break;
        case 500:
          alert('サーバーエラーが発生しました');
          break;
        default:
          alert(`エラー: ${error.error}`);
      }
      
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('Network error:', err);
    alert('ネットワークエラーが発生しました');
    return null;
  }
}
```

---

## レート制限

現在、レート制限は実装されていません。

**推奨される実装**:
- ユーザーあたり: 10アップロード/分
- IPあたり: 100リクエスト/分

---

## セキュリティ

### 認証

- **userId検証**: 各APIでuserIdが一致するか検証
- **所有権確認**: 削除時、リクエストユーザーがファイル所有者か確認

### データ検証

- **ファイルサイズ**: クライアント・サーバー両方で検証
- **MIMEタイプ**: ホワイトリスト方式で検証
- **入力サニタイゼーション**: MongoDBインジェクション対策

### 環境変数

以下の機密情報は環境変数で管理:
- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONGODB_URI`

---

## データモデル

### MongoDB `files` コレクション

```javascript
{
  _id: ObjectId,              // MongoDB自動生成
  userId: String,             // ClerkユーザーID
  fileName: String,           // 元のファイル名
  storagePath: String,        // Supabase内のパス
  fileSize: Number,           // バイト単位
  mimeType: String,           // MIMEタイプ
  url: String,                // 公開URL
  createdAt: Date             // 作成日時
}
```

### Supabase Storage パス

```
litedrive/
  └── {userId}/
      └── {timestamp}_{fileName}
```

例: `litedrive/user_2abc123/1704945600000_example.pdf`

---

## パフォーマンス

### 推奨事項

1. **ファイルサイズ**: 10MB以下に制限
2. **並行アップロード**: クライアント側で1つずつ処理
3. **インデックス**: MongoDB に `{userId: 1, createdAt: -1}` を作成
4. **キャッシュ**: ファイル一覧をクライアントでキャッシュ

### 処理時間目安

| 操作 | 時間 |
|------|------|
| アップロード (1MB) | 1-3秒 |
| アップロード (10MB) | 3-8秒 |
| 一覧取得 | 0.2-0.5秒 |
| 削除 | 0.3-0.7秒 |

---

## 将来の拡張

### 検討中の機能

1. **ページネーション**:
```
GET /api/list?userId=xxx&page=1&limit=20
```

2. **フィルタリング**:
```
GET /api/list?userId=xxx&mimeType=image/*
```

3. **検索**:
```
GET /api/search?userId=xxx&query=report
```

4. **一括削除**:
```
DELETE /api/batch-delete
Body: { fileIds: [...], userId: ... }
```

5. **ファイル共有**:
```
POST /api/share
Body: { fileId: ..., shareWith: "user_xxx" }
```

---

## サポート

API に関する質問や問題は、以下を参照:
- [トラブルシューティングガイド](./troubleshooting.md)
- GitHub Issues（リポジトリ作成後）