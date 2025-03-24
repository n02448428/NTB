import { createClient } from '@vercel/kv';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Initialize KV client
    const kv = createClient({
      url: process.env.STORAGE_REDIS_URL,
      token: process.env.STORAGE_REDIS_TOKEN,
    });
    
    if (req.method === 'GET') {
      // Get top 10 scores
      const scores = await kv.zrange('leaderboard', 0, 9, { rev: true, withScores: true });
      
      // Format scores for display
      const formattedScores = scores.map((item, index) => {
        try {
          const [playerData, score] = item;
          const { name, date } = JSON.parse(playerData);
          
          return {
            rank: index + 1,
            name,
            score,
            date
          };
        } catch (error) {
          console.error('Error parsing player data:', error);
          return null;
        }
      }).filter(Boolean);
      
      return res.status(200).json(formattedScores);
    }
    
    if (req.method === 'POST') {
      const { name, score } = req.body;
      
      if (!name || !score) {
        return res.status(400).json({ error: 'Name and score are required' });
      }
      
      // Create player data object
      const playerData = JSON.stringify({
        name,
        date: new Date().toISOString()
      });
      
      // Add to sorted set
      await kv.zadd('leaderboard', { score: parseInt(score), member: playerData });
      
      // Keep only top 50 scores
      await kv.zremrangebyrank('leaderboard', 0, -51);
      
      return res.status(201).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
