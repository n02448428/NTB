// /api/leaderboard.js
// Simple API endpoint for Vercel that uses fetch to talk to Google Sheets API

// URL to your published Google Sheet as CSV
// This requires your Google Sheet to be published to the web as CSV
// Go to File > Share > Publish to the web > CSV
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTluYzznMqhldGjgshkFvp3A5VfNOiavIo2dFyMnudNRhT81krpTcNydja6d0Q3GDxsnl00-nHhYuqE/pub?output=csv';

// Simple API key for basic protection
const API_KEY = 'dam-9789';

// Helper to parse CSV data
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      const values = line.split(',');
      const entry = { rank: index + 1 };
      
      headers.forEach((header, i) => {
        // Map CSV columns to our expected format
        // Assuming columns: Timestamp, Name, Score, Date
        if (header.includes('Name')) entry.name = values[i];
        if (header.includes('Score')) entry.score = parseInt(values[i]);
        if (header.includes('Date')) entry.date = values[i];
      });
      
      return entry;
    })
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// Helper to append data to Google Sheet
async function appendToSheet(name, score) {
  // There's no direct way to append to Google Sheets without the API
  // For a simple solution, you can use a Google Form or another service like Airtable, Supabase, etc.
  
  // As a proof of concept, we'll return success but note that this doesn't actually save data
  // You'll need to implement a real solution for your production app
  console.log(`Would save: ${name}, ${score}`);
  return true;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle GET request (fetch leaderboard)
    if (req.method === 'GET') {
      // Fetch the published CSV
      const response = await fetch(SHEET_CSV_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const csvText = await response.text();
      const leaderboard = parseCSV(csvText);
      
      // Return the leaderboard
      return res.status(200).json(leaderboard);
    }
    
    // Handle POST request (submit score)
    if (req.method === 'POST') {
      const { name, score, apiKey } = req.body;
      
      // Validate API key
      if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Basic validation
      if (!name || !score) {
        return res.status(400).json({ error: 'Name and score are required' });
      }
      
      // Clean input (basic sanitization)
      const cleanName = String(name).replace(/<[^>]*>?/gm, '').substring(0, 15);
      const cleanScore = parseInt(score);
      
      // Append to sheet (placeholder)
      await appendToSheet(cleanName, cleanScore);
      
      // Since we can't directly modify the sheet, return success with empty leaderboard
      // Client will need to refresh to see updated data
      return res.status(200).json({
        status: 'success',
        message: 'Score submitted'
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}