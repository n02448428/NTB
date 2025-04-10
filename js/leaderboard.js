/* ------------------ LEADERBOARD SYSTEM ------------------ */

// Leaderboard configuration - REPLACE THESE VALUES with your actual credentials
const LEADERBOARD = {
  // Google Sheets configuration - YOU MUST CONFIGURE THESE
  config: {
    // The URL to your deployed Google Apps Script
    appScriptUrl: 'YOUR_APPS_SCRIPT_WEB_APP_URL',
    // A secret key that matches what you set in your Apps Script
    apiKey: 'YOUR_SECRET_API_KEY'
  },
  
  // Local storage keys
  storageKeys: {
    personalScores: 'neonTrailblazerScores',
  },
  
  // UI state
  ui: {
    visible: false,
    loading: false,
    error: null,
  },
  
  // Data
  topScores: [], // Scores from Google Sheet
  personalScores: [], // Scores from local storage
  playerStats: {
    sessionHighScore: 0,
    lastScore: 0,
    averageScore: 0,
    gamesPlayed: 0,
  },
  
  // Initialize the leaderboard system
  initialize: function() {
    console.log('Initializing leaderboard system...');
    
    // Load personal scores from local storage
    this.loadPersonalScores();
    
    // Create UI elements
    this.createLeaderboardButton();
    this.createLeaderboardOverlay();
    
    // Fetch leaderboard data
    this.fetchLeaderboardData();
    
    // Hook into the game over function for score submission
    this.setupGameOverHook();
    
    console.log('Leaderboard system initialized');
  },
  
  // Setup hook for game over to submit scores - fixes the redeclaration error
  setupGameOverHook: function() {
    // Only set up the hook if it hasn't been set up already
    if (typeof window._originalGameOver === 'undefined') {
      // Store the original gameOver function
      window._originalGameOver = window.gameOver;
      
      // Replace with our version that hooks into leaderboard
      window.gameOver = function(message) {
        // Get score before calling original (in case it gets reset)
        let currentScore = 0;
        let playerNameToUse = 'Anonymous';
        
        if (PLAYER && typeof PLAYER.score !== 'undefined') {
          currentScore = PLAYER.score;
          playerNameToUse = window.playerName || localStorage.getItem('neonTrailblazerPlayerName') || 'Anonymous';
        }
        
        // Call the original gameOver function
        if (window._originalGameOver) {
          window._originalGameOver(message);
        }
        
        // Submit the score to the leaderboard - always submit, even if 0
        console.log(`Game over detected, submitting score: ${currentScore}`);
        LEADERBOARD.submitScore(playerNameToUse, currentScore);
      };
      
      console.log('Game over hook set up successfully');
    }
  },
  
  // Fetch leaderboard data from Google Apps Script
  fetchLeaderboardData: function() {
    this.ui.loading = true;
    this.ui.error = null;
    this.updateLeaderboardUI();
    
    // For now, use sample data until you set up the Google Sheet
    this.fallbackToLocalMode();
    this.ui.loading = false;
    this.updateLeaderboardUI();
    
    // Uncomment this when you have the appScriptUrl set up
    /*
    fetch(this.config.appScriptUrl + '?action=getScores')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data) {
          // Parse scores and sort by score (descending)
          const scores = data.data.slice(1); // Skip header row
          
          this.topScores = scores.map(row => ({
            timestamp: row[0] || '',
            name: row[1] || 'Anonymous',
            score: parseInt(row[2], 10) || 0,
            date: row[3] || '',
          })).sort((a, b) => b.score - a.score);
          
          console.log('Leaderboard data loaded:', this.topScores);
        } else {
          this.topScores = [];
          console.warn('No leaderboard data found or unexpected format');
        }
        
        this.ui.loading = false;
        this.updateLeaderboardUI();
      })
      .catch(error => {
        console.error('Error fetching leaderboard data:', error);
        this.ui.loading = false;
        this.ui.error = `Failed to load leaderboard. Using local data only.`;
        
        // Fallback to local data only mode
        this.fallbackToLocalMode();
        this.updateLeaderboardUI();
      });
    */
  },
  
  // Fallback to local data if the server can't be reached
  fallbackToLocalMode: function() {
    // Start with empty leaderboard - no sample scores
    this.topScores = [];
  },
  
  // Generate sample scores for testing/fallback - REMOVED, no more sample scores

  
  // Submit a new score to the leaderboard
  submitScore: function(playerName, score) {
    console.log(`Submitting score: ${score} for player: ${playerName}`);
    
    // Add to personal scores
    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString();
    
    const scoreObj = {
      timestamp: timestamp,
      name: playerName,
      score: score,
      date: dateStr,
      isHighScore: true // All scores are considered high scores at first
    };
    
    // Update session stats
    this.updatePlayerStats(score);
    
    // Add to personal scores
    this.personalScores.unshift(scoreObj);
    
    // Keep only the latest 100 scores
    if (this.personalScores.length > 100) {
      this.personalScores = this.personalScores.slice(0, 100);
    }
    
    // Save to local storage
    this.savePersonalScores();
    
    // ALWAYS add to topScores initially - will be sorted and trimmed to top 50
    this.topScores.push({...scoreObj});
    this.topScores.sort((a, b) => b.score - a.score);
    if (this.topScores.length > 50) {
      this.topScores = this.topScores.slice(0, 50);
    }
    
    // Uncomment this when you have the server set up
    /*
    this.submitScoreToServer(scoreObj).then(success => {
      if (success) {
        this.fetchLeaderboardData(); // Refresh leaderboard data
      }
    });
    */
    
    // Update the UI if leaderboard is visible
    if (this.ui.visible) {
      this.updateLeaderboardUI();
    }
    
    console.log(`Score ${score} added to leaderboard for ${playerName}`);
    return true;
  },
  
  // Submit a score to the server
  submitScoreToServer: function(scoreObj) {
    const data = {
      action: 'submitScore',
      apiKey: this.config.apiKey,
      timestamp: scoreObj.timestamp,
      name: scoreObj.name,
      score: scoreObj.score,
      date: scoreObj.date
    };
    
    return fetch(this.config.appScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      if (result.success) {
        console.log('Score submitted successfully');
        return true;
      } else {
        console.error('Failed to submit score:', result.error);
        return false;
      }
    })
    .catch(error => {
      console.error('Error submitting score:', error);
      return false;
    });
  },
  
  // Load personal scores from local storage
  loadPersonalScores: function() {
    const savedScores = localStorage.getItem(this.storageKeys.personalScores);
    if (savedScores) {
      try {
        this.personalScores = JSON.parse(savedScores);
        this.calculatePlayerStats();
      } catch (e) {
        console.error('Error parsing saved scores:', e);
        this.personalScores = [];
      }
    } else {
      this.personalScores = [];
    }
  },
  
  // Save personal scores to local storage
  savePersonalScores: function() {
    localStorage.setItem(
      this.storageKeys.personalScores, 
      JSON.stringify(this.personalScores)
    );
  },
  
  // Reset personal scores
  resetPersonalScores: function() {
    if (confirm('Are you sure you want to reset your personal score history?')) {
      this.personalScores = [];
      this.playerStats = {
        sessionHighScore: 0,
        lastScore: 0,
        averageScore: 0,
        gamesPlayed: 0,
      };
      localStorage.removeItem(this.storageKeys.personalScores);
      this.updateLeaderboardUI();
    }
  },
  
  // Calculate player statistics
  calculatePlayerStats: function() {
    if (this.personalScores.length === 0) {
      this.playerStats = {
        sessionHighScore: 0,
        lastScore: 0,
        averageScore: 0,
        gamesPlayed: 0,
      };
      return;
    }
    
    // Calculate high score and average
    let totalScore = 0;
    let highScore = 0;
    
    this.personalScores.forEach(score => {
      totalScore += score.score;
      if (score.score > highScore) {
        highScore = score.score;
      }
    });
    
    this.playerStats = {
      sessionHighScore: highScore,
      lastScore: this.personalScores[0].score,
      averageScore: Math.round(totalScore / this.personalScores.length),
      gamesPlayed: this.personalScores.length,
    };
  },
  
  // Update player stats with a new score
  updatePlayerStats: function(score) {
    this.playerStats.lastScore = score;
    this.playerStats.gamesPlayed++;
    
    if (score > this.playerStats.sessionHighScore) {
      this.playerStats.sessionHighScore = score;
    }
    
    // Recalculate average
    const totalScores = this.personalScores.reduce((sum, s) => sum + s.score, 0) + score;
    this.playerStats.averageScore = Math.round(totalScores / this.playerStats.gamesPlayed);
  },
  
  // Show/hide the leaderboard
  toggleLeaderboard: function() {
    this.ui.visible = !this.ui.visible;
    if (this.ui.visible) {
      // Refresh leaderboard data when showing
      this.fetchLeaderboardData();
    }
    this.updateLeaderboardUI();
  },
  
  // Create the leaderboard button
  createLeaderboardButton: function() {
    // Check if button already exists
    if (document.getElementById('leaderboardButton')) {
      return;
    }
    
    const button = document.createElement('button');
    button.id = 'leaderboardButton';
    button.textContent = 'LEADERBOARD';
    button.className = 'game-button';
    
    // Position it next to the EFX button
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.left = '90px';
    button.style.zIndex = '2000';
    button.style.padding = '5px 12px';
    button.style.fontSize = '14px';
    button.style.fontWeight = 'bold';
    button.style.background = 'rgba(0, 0, 0, 0.7)';
    button.style.border = '1px solid #0ff';
    button.style.color = '#0ff';
    button.style.textShadow = '0 0 5px #0ff';
    button.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
    button.style.fontFamily = "'Courier New', monospace";
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', () => this.toggleLeaderboard());
    
    document.body.appendChild(button);
    
    console.log('Leaderboard button created and added to the DOM');
  },
  
  // Create the leaderboard overlay
  createLeaderboardOverlay: function() {
    // Check if overlay already exists
    if (document.getElementById('leaderboardOverlay')) {
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'leaderboardOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.9)';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'none';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontFamily = "'Courier New', monospace";
    overlay.style.color = '#0ff';
    
    overlay.innerHTML = `
      <div style="width: 90%; max-width: 800px; max-height: 90vh; background: rgba(0, 10, 20, 0.85); border: 2px solid #0ff; border-radius: 10px; box-shadow: 0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.2); padding: 30px; display: flex; flex-direction: column; position: relative; overflow: hidden;">
        <h2 style="text-align: center; font-size: 32px; margin-bottom: 20px; text-shadow: 0 0 10px #0ff, 0 0 20px #0ff; letter-spacing: 2px;">NEON TRAILBLAZER LEADERBOARD</h2>
        <div style="display: flex; flex-direction: row; gap: 20px; overflow: hidden;">
          <div style="flex: 3; display: flex; flex-direction: column; overflow: hidden;">
            <div style="display: flex; padding: 10px 0; border-bottom: 1px solid #0ff; font-weight: bold; margin-bottom: 10px;">
              <div style="width: 60px; text-align: center;">RANK</div>
              <div style="flex: 2;">NAME</div>
              <div style="width: 80px; text-align: right;">SCORE</div>
              <div style="width: 100px; text-align: center;">DATE</div>
            </div>
            <div id="leaderboardScoresList" style="overflow-y: auto; max-height: 50vh; padding-right: 10px;">
              <!-- Scores will be inserted here -->
              <div style="text-align: center; padding: 20px; color: #0ff;">Loading leaderboard data...</div>
            </div>
          </div>
          <div style="flex: 1; padding: 0 15px; border-left: 1px solid rgba(0, 255, 255, 0.3); display: flex; flex-direction: column;">
            <h3 style="text-align: center; margin-bottom: 15px; color: #0ff; text-shadow: 0 0 5px #0ff;">YOUR STATS</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid rgba(0, 255, 255, 0.2);">
              <div style="color: #0ff;">Session High Score:</div>
              <div id="sessionHighScore" style="font-weight: bold; color: #fff; text-shadow: 0 0 5px #0ff;">0</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid rgba(0, 255, 255, 0.2);">
              <div style="color: #0ff;">Last Score:</div>
              <div id="lastScore" style="font-weight: bold; color: #fff; text-shadow: 0 0 5px #0ff;">0</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid rgba(0, 255, 255, 0.2);">
              <div style="color: #0ff;">Average Score:</div>
              <div id="averageScore" style="font-weight: bold; color: #fff; text-shadow: 0 0 5px #0ff;">0</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid rgba(0, 255, 255, 0.2);">
              <div style="color: #0ff;">Games Played:</div>
              <div id="gamesPlayed" style="font-weight: bold; color: #fff; text-shadow: 0 0 5px #0ff;">0</div>
            </div>
            <button id="resetPersonalScores" style="margin-top: auto; padding: 8px 15px; background: transparent; border: 1px solid #ff3366; color: #ff3366; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #ff3366; font-size: 14px;">Reset Personal Data</button>
          </div>
        </div>
        <button id="closeLeaderboard" style="margin-top: 20px; align-self: center; padding: 10px 30px; font-size: 16px; background: transparent; border: 2px solid #0ff; color: #0ff; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #0ff;">CLOSE</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('closeLeaderboard').addEventListener('click', () => this.toggleLeaderboard());
    document.getElementById('resetPersonalScores').addEventListener('click', () => this.resetPersonalScores());
    
    console.log('Leaderboard overlay created and added to the DOM');
  },
  
  // Update the leaderboard UI
  updateLeaderboardUI: function() {
    const overlay = document.getElementById('leaderboardOverlay');
    if (!overlay) return;
    
    // Show/hide the overlay
    overlay.style.display = this.ui.visible ? 'flex' : 'none';
    
    if (!this.ui.visible) return;
    
    // Update scores list
    const scoresList = document.getElementById('leaderboardScoresList');
    
    if (this.ui.loading) {
      scoresList.innerHTML = '<div style="text-align: center; padding: 20px; color: #0ff;">Loading leaderboard data...</div>';
      return;
    }
    
    if (this.ui.error) {
      scoresList.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff3366;">${this.ui.error}</div>`;
      
      // But still show scores if we have them
      if (this.topScores.length > 0) {
        scoresList.innerHTML += '<div style="text-align: center; padding: 10px; color: #ffaa00;">Showing cached data:</div>';
      } else {
        return;
      }
    }
    
    // Render top scores
    let scoresHTML = '';
    
    if (this.topScores.length === 0) {
      scoresHTML = '<div style="text-align: center; padding: 20px; color: #0ff;">No scores yet. Be the first to make the leaderboard!</div>';
    } else {
      // Get current player name
      const currentPlayerName = window.playerName || localStorage.getItem('neonTrailblazerPlayerName') || '';
      
      this.topScores.forEach((score, index) => {
        const rank = index + 1;
        let rankClass = '';
        let rankIcon = '';
        
        if (rank === 1) {
          rankClass = 'color: #ffd700; text-shadow: 0 0 5px #ffd700;';
          rankIcon = '🏆 ';
        } else if (rank <= 10) {
          rankClass = 'color: #00bfff; text-shadow: 0 0 5px #00bfff;';
          rankIcon = '🥇 ';
        } else {
          rankClass = 'color: #ff4500; text-shadow: 0 0 5px #ff4500;';
          rankIcon = '🏅 ';
        }
        
        // Check if this is the current player
        const isCurrentPlayer = currentPlayerName && score.name === currentPlayerName;
        const playerStyle = isCurrentPlayer ? 
          'background: rgba(0, 255, 255, 0.15); box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);' : 
          '';
        
        scoresHTML += `
          <div style="display: flex; padding: 10px 0; border-bottom: 1px solid rgba(0, 255, 255, 0.2); transition: background 0.2s; ${playerStyle}">
            <div style="width: 60px; text-align: center; font-weight: bold; display: flex; justify-content: center; align-items: center; ${rankClass}">${rankIcon}${rank}</div>
            <div style="flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${score.name}</div>
            <div style="width: 80px; text-align: right; font-weight: bold;">${score.score}</div>
            <div style="width: 100px; text-align: center;">${score.date}</div>
          </div>
        `;
      });
    }
    
    scoresList.innerHTML = scoresHTML;
    
    // Update player stats
    document.getElementById('sessionHighScore').textContent = this.playerStats.sessionHighScore;
    document.getElementById('lastScore').textContent = this.playerStats.lastScore;
    document.getElementById('averageScore').textContent = this.playerStats.averageScore;
    document.getElementById('gamesPlayed').textContent = this.playerStats.gamesPlayed;
  }
};

// Initialize the leaderboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize after a short delay to ensure the game is fully loaded
  setTimeout(() => {
    LEADERBOARD.initialize();
  }, 1000);
});
