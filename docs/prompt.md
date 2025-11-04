# LiteDrive 完全実装ドキュメント

---

## 1. ディレクトリ構成

```
litedrive/
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
│   └── main.js
├── api/
│   ├── upload.js
│   ├── list.js
│   └── delete.js
├── public/
│   └── favicon.ico
├── index.html
├── vercel.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 2. 環境設定ファイル

### `.env.example`

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_***
CLERK_SECRET_KEY=sk_test_***
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9***
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/litedrive?retryWrites=true&w=majority
```

### `package.json`

```json
{
  "name": "litedrive",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "@clerk/clerk-js": "^5.0.0",
    "mongodb": "^6.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### `vite.config.js`

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### `tailwind.config.js`

```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## 3. バックエンドAPI実装

### `api/upload.js`

```js
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData, userId, fileSize, mimeType } = JSON.parse(req.body);

    if (!fileName || !fileData || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fileBuffer = Buffer.from(fileData, 'base64');
    const storagePath = `${userId}/${Date.now()}_${fileName}`;

    const uploadResponse = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/litedrive/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': mimeType || 'application/octet-stream',
          'x-upsert': 'false'
        },
        body: fileBuffer
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Supabase upload error:', errorText);
      return res.status(500).json({ error: 'Upload to storage failed' });
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/litedrive/${storagePath}`;

    const client = await connectToDatabase();
    const db = client.db('litedrive');
    
    await db.collection('files').insertOne({
      userId,
      fileName,
      storagePath,
      fileSize: fileSize || fileBuffer.length,
      mimeType: mimeType || 'application/octet-stream',
      url: publicUrl,
      createdAt: new Date()
    });

    res.status(200).json({ 
      success: true, 
      url: publicUrl,
      fileName 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### `api/list.js`

```js
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = await connectToDatabase();
    const db = client.db('litedrive');
    
    const files = await db.collection('files')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(files);

  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### `api/delete.js`

```js
import { MongoClient, ObjectId } from 'mongodb';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileId, userId } = JSON.parse(req.body);

    if (!fileId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await connectToDatabase();
    const db = client.db('litedrive');
    
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(fileId),
      userId 
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const deleteResponse = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/litedrive/${file.storagePath}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!deleteResponse.ok) {
      console.error('Supabase delete error:', await deleteResponse.text());
    }

    await db.collection('files').deleteOne({ 
      _id: new ObjectId(fileId),
      userId 
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 4. フロントエンド実装

### `index.html`

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LiteDrive</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### `src/main.js`

```js
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'

createApp(App).mount('#app')
```

### `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
```

### `src/App.vue`

```vue
<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <component :is="currentPage" @change-page="changePage" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import { useAuth } from './composables/useAuth'

const currentPage = ref(Login)
const { initClerk, isAuthenticated } = useAuth()

onMounted(async () => {
  await initClerk()
  if (isAuthenticated.value) {
    currentPage.value = Home
  }
})

const changePage = (page) => {
  currentPage.value = page === 'home' ? Home : Login
}
</script>
```

### `src/composables/useAuth.js`

```js
import { ref } from 'vue'
import { Clerk } from '@clerk/clerk-js'

const clerk = ref(null)
const isAuthenticated = ref(false)
const user = ref(null)

export function useAuth() {
  const initClerk = async () => {
    const clerkInstance = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
    await clerkInstance.load()
    clerk.value = clerkInstance
    
    if (clerkInstance.user) {
      isAuthenticated.value = true
      user.value = clerkInstance.user
    }
  }

  const signIn = async () => {
    await clerk.value.openSignIn()
  }

  const signOut = async () => {
    await clerk.value.signOut()
    isAuthenticated.value = false
    user.value = null
  }

  return {
    clerk,
    isAuthenticated,
    user,
    initClerk,
    signIn,
    signOut
  }
}
```

### `src/pages/Login.vue`

```vue
<template>
  <div class="flex items-center justify-center min-h-screen bg-white">
    <div class="text-center">
      <div class="mb-8">
        <span class="material-icons text-6xl text-blue-500">cloud</span>
        <h1 class="text-3xl font-bold text-gray-800 mt-4">LiteDrive</h1>
        <p class="text-gray-600 mt-2">軽量クラウドストレージ</p>
      </div>
      <button 
        @click="handleSignIn"
        class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 mx-auto transition"
      >
        <span class="material-icons">login</span>
        ログイン
      </button>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['change-page'])
const { signIn, clerk } = useAuth()

const handleSignIn = async () => {
  await signIn()
  clerk.value.addListener((event) => {
    if (event.user) {
      emit('change-page', 'home')
    }
  })
}
</script>
```

### `src/pages/Home.vue`

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-500 text-3xl">cloud</span>
          <h1 class="text-xl font-bold text-gray-800">LiteDrive</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ user?.primaryEmailAddress?.emailAddress }}</span>
          <button 
            @click="handleSignOut"
            class="text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <span class="material-icons">logout</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <FileUploader @file-uploaded="refreshFileList" />
      <FileList :key="listKey" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import FileUploader from '../components/FileUploader.vue'
import FileList from '../components/FileList.vue'

const emit = defineEmits(['change-page'])
const { signOut, user } = useAuth()
const listKey = ref(0)

const handleSignOut = async () => {
  await signOut()
  emit('change-page', 'login')
}

const refreshFileList = () => {
  listKey.value++
}
</script>
```

### `src/components/FileUploader.vue`

```vue
<template>
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <label 
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition"
      :class="{ 'opacity-50': uploading }"
    >
      <span class="material-icons text-6xl text-gray-400 mb-2">cloud_upload</span>
      <span class="text-gray-600">{{ uploading ? 'アップロード中...' : 'ファイルを選択' }}</span>
      <input 
        type="file" 
        class="hidden" 
        @change="handleFileSelect"
        :disabled="uploading"
      />
    </label>
    <div v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['file-uploaded'])
const { user } = useAuth()
const uploading = ref(false)
const error = ref('')

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  error.value = ''

  try {
    const reader = new FileReader()
    
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1]
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            userId: user.value.id,
            fileSize: file.size,
            mimeType: file.type
          })
        })

        if (!response.ok) {
          throw new Error('アップロードに失敗しました')
        }

        emit('file-uploaded')
        event.target.value = ''
      } catch (err) {
        error.value = err.message
      } finally {
        uploading.value = false
      }
    }

    reader.onerror = () => {
      error.value = 'ファイルの読み込みに失敗しました'
      uploading.value = false
    }

    reader.readAsDataURL(file)
  } catch (err) {
    error.value = err.message
    uploading.value = false
  }
}
</script>
```

### `src/components/FileList.vue`

```vue
<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800">ファイル一覧</h2>
    </div>
    
    <div v-if="loading" class="p-8 text-center text-gray-500">
      読み込み中...
    </div>

    <div v-else-if="error" class="p-8 text-center text-red-500">
      {{ error }}
    </div>

    <div v-else-if="files.length === 0" class="p-8 text-center text-gray-500">
      ファイルがありません
    </div>

    <ul v-else class="divide-y divide-gray-200">
      <FileItem 
        v-for="file in files" 
        :key="file._id"
        :file="file"
        @delete="handleDelete"
      />
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import FileItem from './FileItem.vue'

const { user } = useAuth()
const files = ref([])
const loading = ref(true)
const error = ref('')

const loadFiles = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch(`/api/list?userId=${user.value.id}`)
    
    if (!response.ok) {
      throw new Error('ファイルの取得に失敗しました')
    }
    
    files.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleDelete = async (fileId) => {
  try {
    const response = await fetch('/api/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        userId: user.value.id
      })
    })

    if (!response.ok) {
      throw new Error('削除に失敗しました')
    }

    await loadFiles()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(() => {
  loadFiles()
})
</script>
```

### `src/components/FileItem.vue`

```vue
<template>
  <li class="p-4 hover:bg-gray-50 transition">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="material-icons text-gray-500">{{ getFileIcon(file.mimeType) }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ file.fileName }}</p>
          <p class="text-xs text-gray-500">{{ formatFileSize(file.fileSize) }} • {{ formatDate(file.createdAt) }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a 
          :href="file.url" 
          target="_blank"
          class="text-blue-500 hover:text-blue-700 transition"
        >
          <span class="material-icons">download</span>
        </a>
        <button 
          @click="confirmDelete"
          class="text-red-500 hover:text-red-700 transition"
        >
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
  </li>
</template>

<script setup>
const props = defineProps({
  file: Object
})

const emit = defineEmits(['delete'])

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'insert_drive_file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'videocam'
  if (mimeType.startsWith('audio/')) return 'audiotrack'
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'folder_zip'
  return 'insert_drive_file'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const confirmDelete = () => {
  if (confirm(`「${props.file.fileName}」を削除しますか?`)) {
    emit('delete', props.file._id)
  }
}
</script>
```

---

## 5. 外部サービス設定手順

### 5.1 Clerk設定

1. https://clerk.com にアクセスし、アカウント作成
2. 新規アプリケーション作成
3. Authentication → Social Connectionsで Google/GitHub を有効化
4. API Keys画面から以下を取得:
   - `Publishable Key` → `VITE_CLERK_PUBLISHABLE_KEY`
   - `Secret Key` → `CLERK_SECRET_KEY`
5. Paths設定で許可するドメインを追加（本番: Vercelドメイン）

### 5.2 Supabase設定

1. https://supabase.com にアクセスし、プロジェクト作成
2. Storage → Create Bucket → `litedrive` 作成
3. Bucket Settingsで Public Access を有効化
4. Settings → API から以下を取得:
   - `Project URL` → `SUPABASE_URL`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### 5.3 MongoDB Atlas設定

1. https://cloud.mongodb.com にアクセスし、クラスタ作成
2. Database Access → Add New Database User（読み書き権限）
3. Network Access → Add IP Address → `0.0.0.0/0`（全許可、本番では制限推奨）
4. Database → Connect → Connect your application → Connection String取得
5. データベース名を `litedrive` に設定
6. 接続URI → `MONGODB_URI`

---

## 6. デプロイ手順

### 6.1 ローカル開発

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集し、各種APIキーを設定

# 開発サーバー起動
npm run dev
```

### 6.2 Vercelデプロイ

1. GitHubにリポジトリ作成・プッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. https://vercel.com でプロジェクトインポート
3. Framework Preset: `Vite`
4. Environment Variables に以下を設定:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MONGODB_URI`
5. Deploy実行

---

## 7. 動作確認チェックリスト

- [ ] Clerkログイン画面が表示される
- [ ] Google/GitHubでログイン可能
- [ ] ファイルアップロード成功
- [ ] アップロード後、ファイル一覧に表示される
- [ ] ファイルダウンロード可能
- [ ] ファイル削除機能動作
- [ ] ログアウト後、再ログインで同じファイルが表示される

---

## 8. トラブルシューティング

### Supabaseアップロードエラー

- Service Role Keyを使用しているか確認
- Bucketが `public` に設定されているか確認
- CORS設定を確認

### MongoDB接続エラー

- 接続URIが正しいか確認
- Network Accessで `0.0.0.0/0` が許可されているか確認
- Database Userの権限確認

### Clerk認証エラー

- Publishable Keyが正しいか確認
- Vercelドメインが許可リストに登録されているか確認

---

## 9. セキュリティ考慮事項

1. **MongoDB接続**: 本番環境ではIP制限を設定
2. **Supabase RLS**: Row Level Securityを有効化推奨
3. **ファイルサイズ制限**: アップロード時にサイズ上限を設定
4. **MIME Type検証**: 危険なファイル形式を制限
5. **Rate Limiting**: Vercel Functions に rate limit 設定