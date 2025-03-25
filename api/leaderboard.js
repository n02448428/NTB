import { createClient } from 'redis';

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
    // Initialize Redis client
    const redis = createClient({
      url: process.env.STORAGE_REDIS_URL,
      password: process.env.STORAGE_REDIS_TOKEN,
    });
    
    await redis.connect();
    
    if (req.method === 'GET') {
      // Get top 10 scores
      const scores = await redis.zRange('leaderboard', 0, 9, {
        REV: true,
        WITHSCORES: true
      });
      
      // Format scores for display
      const formattedScores = [];
      for (let i = 0; i < scores.length; i += 2) {
        try {
          const playerData = scores[i];
          const score = parseInt(scores[i+1]);
          const { name, date } = JSON.parse(playerData);
          
          formattedScores.push({
            rank: formattedScores.length + 1,
            name,
            score,
            date
          });
        } catch (error) {
          console.error('Error parsing player data:', error);
        }
      }
      
      await redis.disconnect();
      return res.status(200).json(formattedScores);
    }
    
    if (req.method === 'POST') {
      const { name, score } = req.body;
      
      if (!name || !score) {
        await redis.disconnect();
        return res.status(400).json({ error: 'Name and score are required' });
      }
      
      // Create player data object
      const playerData = JSON.stringify({
        name,
        date: new Date().toISOString()
      });
      
      // Add to sorted set
      await redis.zAdd('leaderboard', [{
        score: parseInt(score),
        value: playerData
      }]);
      
      // Keep only top 50 scores
      await redis.zRemRangeByRank('leaderboard', 0, -51);
      
      await redis.disconnect();
      return res.status(201).json({ success: true });
    }
    
    await redis.disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
}
