import { MongoClient } from 'mongodb';

async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client = null;

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    client = await connectToDatabase();
    const db = client.db('litedrive');
    
    const files = await db.collection('files')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(files);

  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
}