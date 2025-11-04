# MongoDB Atlas 設定ガイド

## 概要
MongoDB Atlasはクラウド型MongoDBサービスです。ファイルのメタデータを保存します。

## 必要な設定

### 1. アカウント作成

1. https://www.mongodb.com/cloud/atlas/register にアクセス
2. メールアドレスで登録、またはGoogleアカウントでサインアップ
3. アンケート画面が表示される場合は適当に回答（スキップ可能）

### 2. クラスタ作成

#### 2.1 デプロイメント作成

1. 「Create」ボタンをクリック
2. デプロイメントタイプを選択: **M0 (Free)**
3. クラウドプロバイダ: **AWS**（推奨）または Google Cloud/Azure
4. リージョン選択: 
   - 推奨: `ap-northeast-1` (東京)
   - または `ap-southeast-1` (シンガポール)
5. Cluster Name: `Cluster0`（デフォルトでOK）
6. 「Create Deployment」をクリック

#### 2.2 認証情報作成

自動的にセキュリティ設定画面に遷移します。

1. **Username**: `litedrive-user`（任意）
2. **Password**: 自動生成 または 独自のパスワード
   - ⚠️ **このパスワードを保存してください**
3. 「Create Database User」をクリック

### 3. ネットワークアクセス設定

#### IPアドレス許可リスト

1. 左サイドバー → **Network Access**
2. 「Add IP Address」をクリック
3. 2つの選択肢:

**開発環境（推奨）**:
```
IP Address: 0.0.0.0/0
Description: Allow all (development)
```

**本番環境（セキュア）**:
- Vercelの送信元IPを個別に追加
- または Vercelの IP範囲を追加

4. 「Confirm」をクリック

⚠️ **セキュリティ注意**: `0.0.0.0/0` は全IPを許可します。本番環境では推奨されませんが、Vercel Functionsは動的IPを使用するため実質的に必要です。

### 4. 接続URI取得

#### 4.1 接続方法選択

1. 左サイドバー → **Database** → 自分のクラスタ
2. 「Connect」ボタンをクリック
3. 「Drivers」を選択
4. Driver: **Node.js**
5. Version: **6.0 or later**

#### 4.2 接続文字列コピー

表示される接続文字列をコピー:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### 4.3 接続文字列編集

1. `<username>` を実際のユーザー名に置換
2. `<password>` を実際のパスワードに置換
3. データベース名を追加:

```
mongodb+srv://litedrive-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/litedrive?retryWrites=true&w=majority
```

**重要**: `/litedrive?` の部分がデータベース名です。

### 5. データベース初期化（自動）

LiteDriveでは初めてファイルをアップロードした際に自動的に以下が作成されます:

- データベース: `litedrive`
- コレクション: `files`

手動で作成する必要はありません。

### 6. 環境変数設定

`.env.local` に追加:

```bash
MONGODB_URI=mongodb+srv://litedrive-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/litedrive?retryWrites=true&w=majority
```

## データ構造

### `files` コレクション

```javascript
{
  _id: ObjectId("..."),           // MongoDB自動生成ID
  userId: "user_xxxxx",            // ClerkユーザーID
  fileName: "example.pdf",         // ファイル名
  storagePath: "user_xxx/123_example.pdf", // Supabase内のパス
  fileSize: 1024000,               // ファイルサイズ（バイト）
  mimeType: "application/pdf",     // MIMEタイプ
  url: "https://...supabase.co/storage/v1/object/public/litedrive/...", // 公開URL
  createdAt: ISODate("2025-01-15T10:30:00.000Z") // 作成日時
}
```

### インデックス（推奨）

大量のファイルを扱う場合、以下のインデックスを作成:

1. MongoDB Atlas → Database → Browse Collections
2. `litedrive` → `files` コレクションを選択
3. 「Indexes」タブ → 「Create Index」

```javascript
// ユーザーIDと作成日時の複合インデックス
{
  userId: 1,
  createdAt: -1
}
```

## 動作確認

### 接続テスト（オプション）

ローカルでテスト用スクリプトを実行:

```javascript
// test-mongodb.js
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://..."; // あなたの接続URI
const client = new MongoClient(uri);

async function test() {
  try {
    await client.connect();
    console.log("✓ MongoDB接続成功");
    
    const db = client.db('litedrive');
    await db.collection('files').insertOne({ test: true });
    console.log("✓ テストドキュメント挿入成功");
    
    await db.collection('files').deleteOne({ test: true });
    console.log("✓ テストドキュメント削除成功");
  } finally {
    await client.close();
  }
}

test();
```

実行:
```bash
node test-mongodb.js
```

### アプリケーションでの確認

1. アプリケーションを起動
2. ファイルをアップロード
3. MongoDB Atlas → Database → Browse Collections
4. `litedrive` → `files` にドキュメントが追加されていることを確認

## トラブルシューティング

### エラー: "MongoServerError: bad auth"

**原因**: ユーザー名またはパスワードが間違っている

**解決方法**:
1. MongoDB Atlas → Database Access
2. ユーザーが存在するか確認
3. パスワードをリセット（Edit User → Edit Password）
4. 新しいパスワードで接続文字列を更新

### エラー: "MongooseServerSelectionError: Could not connect"

**原因**: ネットワークアクセスが許可されていない

**解決方法**:
1. MongoDB Atlas → Network Access
2. 接続元IPアドレスが許可されているか確認
3. `0.0.0.0/0` を追加（開発環境）

### エラー: "connect ETIMEDOUT"

**原因**: ファイアウォールまたはVPNがMongoDBへの接続をブロック

**解決方法**:
1. VPNを無効化して再試行
2. ファイアウォール設定を確認
3. 別のネットワークで試す

### データベース名が見つからない

**原因**: 接続URIにデータベース名が含まれていない

**解決方法**:
```
❌ mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true
✅ mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/litedrive?retryWrites=true
                                                         ^^^^^^^^
```

### 接続が遅い

**原因**: リージョンが遠い

**解決方法**:
1. クラスタのリージョンを確認
2. 可能であれば近いリージョン（東京、シンガポール）に新しいクラスタを作成
3. データを移行

## セキュリティ推奨設定

### 1. Database User の権限

1. Database Access → ユーザーを選択 → Edit
2. Database User Privileges:
   - Built-in Role: **Read and write to any database**
   - または特定のDBのみ: Custom Role で `litedrive` のみに制限

### 2. IP許可リストの厳格化（本番環境）

開発完了後、`0.0.0.0/0` を削除し、必要なIPのみ許可:

```
# Vercelの場合（動的IPのため実質的に困難）
# 代替案: MongoDB Realm/Atlas App Servicesを使用
```

### 3. パスワードの複雑化

- 最低16文字
- 英数字 + 記号
- 定期的な変更

## データバックアップ

### 手動バックアップ

1. MongoDB Atlas → Database → `...` メニュー
2. 「Export Collection」を選択
3. JSON形式でダウンロード

### 自動バックアップ（有料プラン）

M10以上のクラスタでは自動バックアップが利用可能。

## 料金

- **M0 Free Tier**:
  - ストレージ: 512MB
  - RAM: 共有
  - 接続数: 最大500
  - LiteDriveでは十分

- **制限到達時**:
  - M10プラン（月$9〜）にアップグレード

## 参考リンク

- [MongoDB Atlas公式ドキュメント](https://www.mongodb.com/docs/atlas/)
- [Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [接続文字列フォーマット](https://www.mongodb.com/docs/manual/reference/connection-string/)