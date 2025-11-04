import { MongoClient, ObjectId } from 'mongodb';

async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client = null;

  try {
    const { fileId, userId } = JSON.parse(req.body);

    if (!fileId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    client = await connectToDatabase();
    const db = client.db('litedrive');
    
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(fileId),
      userId 
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // MongoDBから先に削除（削除失敗時はSupabaseに残る方が安全）
    const deleteResult = await db.collection('files').deleteOne({ 
      _id: new ObjectId(fileId),
      userId 
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ error: 'Delete failed' });
    }

    // Supabaseから削除（失敗してもDBからは削除済み）
    try {
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
        console.error('Supabase delete warning:', await deleteResponse.text());
        // エラーログのみ、レスポンスは成功を返す
      }
    } catch (storageError) {
      console.error('Supabase delete error:', storageError);
      // ストレージ削除失敗してもDB削除は成功しているので成功を返す
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
}