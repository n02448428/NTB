/* ------------------ VERCEL API LEADERBOARD SYSTEM ------------------ */

// This file should be placed at /public/js/onlineLeaderboard.js in your Vercel project

// Leaderboard state
let playerName = '';
let playerScore = 0;
let isLoading = false;

// Function to save score to leaderboard
async function saveScoreToLeaderboard(name, score) {
  try {
    console.log(`Saving score: ${name} - ${score}`);
    isLoading = true;
    
    // Create the data to send
    const scoreData = {
      name: name,
      score: score,
      apiKey: 'dam-9789' // Must match the key in the API endpoint
    };
    
    // Send score to Vercel API endpoint
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scoreData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Score saved successfully:", result);
    
    if (typeof UTILS !== 'undefined' && UTILS.showToast) {
      UTILS.showToast("Score submitted to global leaderboard!");
    }
    
    isLoading = false;
    return true;
    
  } catch (error) {
    console.warn('Online leaderboard not available - score saved locally only');
    
    // Save locally as fallback
    saveLocalScore(name, score);
    
    if (typeof UTILS !== 'undefined' && UTILS.showToast) {
      UTILS.showToast("Network error: Score saved locally only");
    }
    
    isLoading = false;
    return false;
  }
}

// Function to save score locally (fallback only)
function saveLocalScore(name, score) {
  const leaderboard = JSON.parse(localStorage.getItem('neonTrailblazerLeaderboard') || '[]');
  leaderboard.push({
    name: name,
    score: score,
    date: new Date().toISOString()
  });
  
  leaderboard.sort((a, b) => b.score - a.score);
  const limitedLeaderboard = leaderboard.slice(0, 50);
  
  localStorage.setItem('neonTrailblazerLeaderboard', JSON.stringify(limitedLeaderboard));
}

// Function to display the leaderboard
async function displayLeaderboard() {
  if (isLoading) return;
  
  try {
    console.log("Fetching leaderboard data...");
    isLoading = true;
    
    // Show loading message
    const leaderboardBody = document.getElementById('leaderboardBody');
    leaderboardBody.innerHTML = '<tr><td colspan="4">Loading global leaderboard...</td></tr>';
    
    // Update heading
    const leaderboardTitle = document.querySelector('#leaderboardPanel h2');
    if (leaderboardTitle) {
      leaderboardTitle.innerHTML = 'LEADERBOARD <span style="color:#0ff;font-size:14px;">[LOADING]</span>';
    }
    
    // Fetch from Vercel API endpoint
    const response = await fetch(`/api/leaderboard?t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Leaderboard data received:", data);
    
    // Display the online leaderboard
    displayLeaderboardData(data, true);
    
    isLoading = false;
    
  } catch (error) {
    console.error("Error fetching online leaderboard:", error);
    
    // Fall back to local leaderboard
    displayLocalLeaderboard();
    
    isLoading = false;
  }
}

// Display local leaderboard (fallback)
function displayLocalLeaderboard() {
  console.log("Displaying local leaderboard...");
  
  const leaderboard = JSON.parse(localStorage.getItem('neonTrailblazerLeaderboard') || '[]');
  
  // Sort and add rank
  leaderboard.sort((a, b) => b.score - a.score);
  const rankedLeaderboard = leaderboard.map((entry, index) => ({
    rank: index + 1,
    name: entry.name,
    score: entry.score,
    date: entry.date
  }));
  
  // Display the local leaderboard
  displayLeaderboardData(rankedLeaderboard, false);
}

// Function to display leaderboard data
function displayLeaderboardData(data, isOnline) {
  const leaderboardBody = document.getElementById('leaderboardBody');
  leaderboardBody.innerHTML = '';
  
  // Update heading
  const leaderboardTitle = document.querySelector('#leaderboardPanel h2');
  if (leaderboardTitle) {
    if (isOnline) {
      leaderboardTitle.innerHTML = 'GLOBAL LEADERBOARD <span style="color:#0f0;font-size:14px;">[ONLINE]</span>';
    } else {
      leaderboardTitle.innerHTML = 'LOCAL SCORES <span style="color:#ff0;font-size:14px;">[OFFLINE]</span>';
    }
  }
  
  // Display data
  if (!data || data.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">No scores yet</td>';
    leaderboardBody.appendChild(row);
  } else {
    // Show top 10 scores
    const displayData = data.slice(0, 10);
    
    displayData.forEach(entry => {
      const row = document.createElement('tr');
      
      // Highlight current player's score
      if (entry.name === playerName) {
        row.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
        row.style.fontWeight = 'bold';
      }
      
      row.innerHTML = `
        <td>${entry.rank}</td>
        <td>${entry.name}</td>
        <td>${entry.score}</td>
        <td>${formatDate(entry.date)}</td>
      `;
      
      leaderboardBody.appendChild(row);
    });
  }
  
  // Add buttons
  addLeaderboardButtons(isOnline);
}

// Add buttons to the leaderboard
function addLeaderboardButtons(isOnline) {
  const closeButton = document.getElementById('closeLeaderboard');
  
  // Remove existing buttons except close
  const existingButton = document.getElementById('refreshLeaderboard');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Add refresh/retry button
  const refreshButton = document.createElement('button');
  refreshButton.id = 'refreshLeaderboard';
  
  if (isOnline) {
    refreshButton.textContent = 'REFRESH';
  } else {
    refreshButton.textContent = 'TRY ONLINE';
  }
  
  refreshButton.style.marginRight = '10px';
  
  if (closeButton && closeButton.parentNode) {
    closeButton.parentNode.insertBefore(refreshButton, closeButton);
    
    refreshButton.addEventListener('click', displayLeaderboard);
  }
}

// Format date helper function
function formatDate(dateString) {
  if (typeof UTILS !== 'undefined' && UTILS.formatDate) {
    return UTILS.formatDate(dateString);
  }
  
  // Fallback date formatter
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}

// Set up the leaderboard system
function setupOnlineLeaderboard() {
  console.log("Setting up online leaderboard system...");
  
  // Add CSS styles
  addLeaderboardStyles();
  
  // Override the original leaderboard functions
  window.addToLeaderboard = function(name, score) {
    playerName = name;
    playerScore = score;
    saveScoreToLeaderboard(name, score);
  };
  
  window.showLeaderboard = function() {
    document.getElementById('leaderboardPanel').style.display = 'block';
    displayLeaderboard();
  };
  
  window.hideLeaderboard = function() {
    document.getElementById('leaderboardPanel').style.display = 'none';
  };
  
  console.log("Online leaderboard system initialized!");
}

// Add CSS styles for the leaderboard
function addLeaderboardStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #leaderboardTable {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Courier New', monospace;
    }
    
    #leaderboardTable th {
      border-bottom: 2px solid #0ff;
      padding: 8px;
      text-align: center;
    }
    
    #leaderboardTable td {
      padding: 8px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 255, 255, 0.3);
    }
    
    #leaderboardTable tr:nth-child(even) {
      background: rgba(0, 255, 255, 0.1);
    }
    
    #refreshLeaderboard, #closeLeaderboard {
      margin-top: 15px;
      background: transparent;
      border: 2px solid #0ff;
      color: #0ff;
      padding: 8px 15px;
      font-size: 16px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
      text-shadow: 0 0 5px #0ff;
    }
    
    #refreshLeaderboard:hover, #closeLeaderboard:hover {
      background: rgba(0, 255, 255, 0.2);
    }
  `;
  document.head.appendChild(style);
}

// Initialize the leaderboard system
setupOnlineLeaderboard();
