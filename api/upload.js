import { MongoClient } from 'mongodb';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/zip',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav'
];

async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client;
}

async function deleteFromSupabase(storagePath) {
  try {
    await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/litedrive/${storagePath}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
  } catch (error) {
    console.error('Rollback failed:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client = null;
  let storagePath = null;

  try {
    const { fileName, fileData, userId, fileSize, mimeType } = JSON.parse(req.body);

    // 入力検証
    if (!fileName || !fileData || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ファイルサイズ検証
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File too large (max 10MB)' });
    }

    // MIME type検証
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(415).json({ error: 'Unsupported file type' });
    }

    const fileBuffer = Buffer.from(fileData, 'base64');
    
    // 実際のファイルサイズ検証
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File too large (max 10MB)' });
    }

    storagePath = `${userId}/${Date.now()}_${fileName}`;

    // Supabaseアップロード
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

    // MongoDBに保存（失敗時はSupabaseから削除）
    try {
      client = await connectToDatabase();
      const db = client.db('litedrive');
      
      await db.collection('files').insertOne({
        userId,
        fileName,
        storagePath,
        fileSize: fileBuffer.length,
        mimeType: mimeType || 'application/octet-stream',
        url: publicUrl,
        createdAt: new Date()
      });
    } catch (dbError) {
      console.error('MongoDB error:', dbError);
      // ロールバック: Supabaseから削除
      await deleteFromSupabase(storagePath);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ 
      success: true, 
      url: publicUrl,
      fileName 
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // エラー時のクリーンアップ
    if (storagePath) {
      await deleteFromSupabase(storagePath);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
}