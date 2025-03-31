// This is an enhanced version of the leaderboard system with improved UI

/* ------------------ ENHANCED GLOBAL LEADERBOARD SYSTEM ------------------ */

function setupLeaderboard() {
  // Your Google Apps Script Web App URL (you'll get this after deployment)
  const LEADERBOARD_API_URL = 'https://script.google.com/macros/s/AKfycbw3l81ORv814sHKxXgD2Th03C1M_vRm9w9uXzpobVURsqQ2sTVLoyiHzdUTllddFka2CQ/exec';
  
  // Leaderboard state
  let leaderboardData = [];
  let playerRank = null;
  let isLoading = false;
  
  // Function to save score to leaderboard
  async function saveScoreToLeaderboard(name, score) {
    try {
      isLoading = true;
      updateLeaderboardStatus('SUBMITTING SCORE...');
      
      const response = await fetch(LEADERBOARD_API_URL, {
        method: 'POST',
        body: JSON.stringify({ name, score }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('Error saving score to online leaderboard');
        showToastMessage('Score submitted, but there was a connection issue');
        isLoading = false;
        return false;
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        showToastMessage('Score submitted to global leaderboard!');
        leaderboardData = result.leaderboard || [];
        findPlayerRank(name, score);
        isLoading = false;
        return true;
      } else {
        console.warn('API error:', result.message);
        showToastMessage('Score submitted, but there was a server issue');
        isLoading = false;
        return false;
      }
    } catch (error) {
      console.warn('Error saving score:', error);
      showToastMessage('Could not connect to leaderboard server');
      updateLeaderboardStatus('OFFLINE');
      isLoading = false;
      return false;
    }
  }
  
  // Function to show a temporary notification
  function showToastMessage(message) {
    if (typeof UTILS !== 'undefined' && UTILS.showToast) {
      UTILS.showToast(message);
    } else {
      // Fallback if UTILS is not available
      console.log(message);
      
      // Create a simple toast if UTILS.showToast doesn't exist
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = '#00ffff';
      toast.style.color = '#000';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '4px';
      toast.style.zIndex = '10000';
      toast.style.fontFamily = 'Courier New, monospace';
      toast.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
      toast.textContent = message;
      
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 3000);
    }
  }
  
  // Find player's rank in the leaderboard
  function findPlayerRank(playerName, playerScore) {
    playerRank = null;
    
    // First try to find exact match
    for (let i = 0; i < leaderboardData.length; i++) {
      if (leaderboardData[i].name === playerName && 
          leaderboardData[i].score === playerScore) {
        playerRank = leaderboardData[i].rank;
        break;
      }
    }
    
    // If not found, find the last entry with the same name
    if (!playerRank) {
      for (let i = 0; i < leaderboardData.length; i++) {
        if (leaderboardData[i].name === playerName) {
          playerRank = leaderboardData[i].rank;
        }
      }
    }
  }
  
  // Update the leaderboard status text
  function updateLeaderboardStatus(status) {
    const leaderboardTitle = document.querySelector('#leaderboardPanel h2');
    if (leaderboardTitle) {
      if (status === 'ONLINE') {
        leaderboardTitle.innerHTML = 'GLOBAL LEADERBOARD <span style="color:#0f0;font-size:14px;">[ONLINE]</span>';
      } else if (status === 'OFFLINE') {
        leaderboardTitle.innerHTML = 'LEADERBOARD <span style="color:#ff0;font-size:14px;">[OFFLINE]</span>';
      } else if (status === 'LOADING') {
        leaderboardTitle.innerHTML = 'LEADERBOARD <span style="color:#0ff;font-size:14px;">[LOADING]</span>';
      } else if (status === 'SUBMITTING SCORE...') {
        leaderboardTitle.innerHTML = 'LEADERBOARD <span style="color:#0ff;font-size:14px;">[SUBMITTING SCORE...]</span>';
      } else {
        leaderboardTitle.innerHTML = 'LEADERBOARD <span style="color:#0ff;font-size:14px;">[' + status + ']</span>';
      }
    }
  }
  
  // Function to fetch and display leaderboard
  async function displayLeaderboard() {
    if (isLoading) return;
    
    try {
      isLoading = true;
      
      // Show loading message
      const leaderboardBody = document.getElementById('leaderboardBody');
      leaderboardBody.innerHTML = '<tr><td colspan="4">Loading global leaderboard...</td></tr>';
      
      // Update indicator
      updateLeaderboardStatus('LOADING');
      
      // Fetch leaderboard data
      const response = await fetch(LEADERBOARD_API_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      leaderboardData = await response.json();
      
      // Clear loading message
      leaderboardBody.innerHTML = '';
      
      // Update indicator
      updateLeaderboardStatus('ONLINE');
      
      if (leaderboardData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4">No scores yet - be the first!</td>';
        leaderboardBody.appendChild(row);
      } else {
        // Display the leaderboard entries
        leaderboardData.slice(0, 10).forEach((entry) => {
          const row = document.createElement('tr');
          
          // Highlight the player's own score
          if (playerName && entry.name === playerName) {
            row.className = 'player-row';
            row.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
          }
          
          row.innerHTML = `
            <td>${entry.rank}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${formatDate(entry.date)}</td>
          `;
          leaderboardBody.appendChild(row);
        });
        
        // Add player's rank if not in top 10
        if (playerRank && playerRank > 10) {
          // Add separator
          const separator = document.createElement('tr');
          separator.innerHTML = '<td colspan="4" style="height:10px; border-bottom:1px dashed #0ff;"></td>';
          leaderboardBody.appendChild(separator);
          
          // Find player entry
          const playerEntry = leaderboardData.find(entry => entry.rank === playerRank);
          if (playerEntry) {
            const playerRow = document.createElement('tr');
            playerRow.className = 'player-row';
            playerRow.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
            playerRow.innerHTML = `
              <td>${playerEntry.rank}</td>
              <td>${playerEntry.name}</td>
              <td>${playerEntry.score}</td>
              <td>${formatDate(playerEntry.date)}</td>
            `;
            leaderboardBody.appendChild(playerRow);
          }
        }
      }
      
      // Add refresh button
      addRefreshButton();
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      
      // Show error message
      const leaderboardBody = document.getElementById('leaderboardBody');
      leaderboardBody.innerHTML = `
        <tr><td colspan="4">Could not connect to leaderboard server</td></tr>
        <tr><td colspan="4"><button id="retryLeaderboard" style="margin-top:10px;">Retry Connection</button></td></tr>
      `;
      
      // Add retry button handler
      document.getElementById('retryLeaderboard').addEventListener('click', () => {
        displayLeaderboard();
      });
      
      // Update indicator
      updateLeaderboardStatus('OFFLINE');
    }
    
    isLoading = false;
  }
  
  // Add refresh button to leaderboard
  function addRefreshButton() {
    const leaderboardPanel = document.getElementById('leaderboardPanel');
    const closeButton = document.getElementById('closeLeaderboard');
    
    // Remove existing refresh button if present
    const existingButton = document.getElementById('refreshLeaderboard');
    if (existingButton) {
      existingButton.remove();
    }
    
    // Create refresh button
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refreshLeaderboard';
    refreshButton.textContent = 'REFRESH';
    refreshButton.style.marginLeft = '10px';
    
    // Add before close button
    if (closeButton && closeButton.parentNode) {
      closeButton.parentNode.insertBefore(refreshButton, closeButton);
      
      // Add click handler
      refreshButton.addEventListener('click', () => {
        displayLeaderboard();
      });
    }
  }
  
  // Format date for display (uses the existing utility if available)
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
  
  // Initialize CSS for the leaderboard
  function initLeaderboardStyles() {
    // Add CSS to head
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
      
      .player-row {
        font-weight: bold;
        text-shadow: 0 0 5px #ff00ff;
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
  
  // Override the addToLeaderboard function
  window.addToLeaderboard = function (name, score) {
    // Store the current player name globally
    window.playerName = name;
    
    // Save score to online leaderboard
    saveScoreToLeaderboard(name, score).catch(console.error);
  };
  
  // Override the showLeaderboard function
  window.showLeaderboard = function () {
    displayLeaderboard().catch(console.error);
    document.getElementById('leaderboardPanel').style.display = 'block';
  };
  
  // Initialize styles
  initLeaderboardStyles();
  
  // Remove the toggle button since we're not supporting local scores anymore
  const toggleButton = document.getElementById('toggleLeaderboard');
  if (toggleButton) {
    toggleButton.remove();
  }
  
  // Return API for testing
  return {
    refreshLeaderboard: displayLeaderboard,
    getLeaderboardData: () => leaderboardData
  };
}

// Initialize the leaderboard system
const leaderboardSystem = setupLeaderboard();
