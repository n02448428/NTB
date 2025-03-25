export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return test data without any database connections
  const testScores = [
    {rank: 1, name: "Test1", score: 100, date: new Date().toISOString()},
    {rank: 2, name: "Test2", score: 90, date: new Date().toISOString()},
    {rank: 3, name: "Test3", score: 80, date: new Date().toISOString()}
  ];
  
  return res.status(200).json(testScores);
}
