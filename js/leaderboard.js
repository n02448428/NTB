/* ------------------ LEADERBOARD SYSTEM ------------------ */

// Leaderboard configuration - REPLACE THESE VALUES with your actual credentials
const LEADERBOARD = {
    // Google Sheets configuration - YOU MUST CONFIGURE THESE
    config: {
      // The URL to your deployed Google Apps Script
      appScriptUrl: 'https://script.google.com/macros/s/AKfycbwnhyUcqvJ08hJH96Gq8mT6ueaVvx4LTG_mAD06RUndnpoHSB30gty_slSDnF6GM0iJoA/exec',
      // A secret key that matches what you set in your Apps Script
      apiKey: 'dam-9789'
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
      // Load personal scores from local storage
      this.loadPersonalScores();
      
      // Create UI elements
      this.createLeaderboardButton();
      this.createLeaderboardOverlay();
      
      // Fetch leaderboard data
      this.fetchLeaderboardData();
      
      console.log('Leaderboard system initialized');
    },
    
    // Fetch leaderboard data from Google Apps Script
    fetchLeaderboardData: function() {
      this.ui.loading = true;
      this.ui.error = null;
      this.updateLeaderboardUI();
      
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
    },
    
    // Fallback to local data if the server can't be reached
    fallbackToLocalMode: function() {
      // Generate some sample scores if none exist
      if (this.topScores.length === 0) {
        this.generateSampleScores();
      }
    },
    
    // Generate sample scores for testing/fallback
    generateSampleScores: function() {
      this.topScores = [];
      
      const names = ['CyberRacer', 'NeonRider', 'GridMaster', 'LightCycle', 'ByteRunner', 
                     'PixelDrift', 'GlitchHunter', 'WaveRider', 'SynthDriver', 'RetroRacer'];
      
      for (let i = 0; i < 50; i++) {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomScore = Math.floor(Math.random() * 1000) + 100;
        
        // Generate a random date within the last 30 days
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - randomDaysAgo);
        
        this.topScores.push({
          timestamp: date.toISOString(),
          name: randomName,
          score: randomScore,
          date: date.toLocaleDateString()
        });
      }
      
      // Sort by score (descending)
      this.topScores.sort((a, b) => b.score - a.score);
    },
    
    // Submit a new score to the leaderboard
    submitScore: function(playerName, score) {
      // Add to personal scores
      const timestamp = new Date().toISOString();
      const dateStr = new Date().toLocaleDateString();
      
      const scoreObj = {
        timestamp: timestamp,
        name: playerName,
        score: score,
        date: dateStr,
        isHighScore: false, // Will be determined later
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
      
      // Check if score is high enough for the leaderboard
      const lowestTopScore = this.topScores.length >= 50 ? this.topScores[49].score : 0;
      
      if (score > lowestTopScore || this.topScores.length < 50) {
        // Score is high enough to be on the leaderboard
        this.submitScoreToServer(scoreObj).then(success => {
          if (success) {
            scoreObj.isHighScore = true;
            this.fetchLeaderboardData(); // Refresh leaderboard data
          }
        });
      }
      
      // Update the UI
      this.updateLeaderboardUI();
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
      button.style.position = 'fixed';
      button.style.top = '10px';
      button.style.left = '100px';
      button.style.zIndex = '101';
      
      button.addEventListener('click', () => this.toggleLeaderboard());
      
      document.body.appendChild(button);
    },
    
    // Create the leaderboard overlay
    createLeaderboardOverlay: function() {
      // Check if overlay already exists
      if (document.getElementById('leaderboardOverlay')) {
        return;
      }
      
      const overlay = document.createElement('div');
      overlay.id = 'leaderboardOverlay';
      overlay.className = 'game-overlay';
      overlay.style.display = 'none';
      
      overlay.innerHTML = `
        <div class="leaderboard-container">
          <h2>NEON TRAILBLAZER LEADERBOARD</h2>
          <div class="leaderboard-content">
            <div class="leaderboard-scores">
              <div class="leaderboard-header">
                <div class="rank">RANK</div>
                <div class="name">NAME</div>
                <div class="score">SCORE</div>
                <div class="date">DATE</div>
              </div>
              <div id="leaderboardScoresList" class="leaderboard-scores-list">
                <!-- Scores will be inserted here -->
                <div class="loading-message">Loading leaderboard data...</div>
              </div>
            </div>
            <div class="personal-stats">
              <h3>YOUR STATS</h3>
              <div class="stat-row">
                <div class="stat-label">Session High Score:</div>
                <div id="sessionHighScore" class="stat-value">0</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">Last Score:</div>
                <div id="lastScore" class="stat-value">0</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">Average Score:</div>
                <div id="averageScore" class="stat-value">0</div>
              </div>
              <div class="stat-row">
                <div class="stat-label">Games Played:</div>
                <div id="gamesPlayed" class="stat-value">0</div>
              </div>
              <button id="resetPersonalScores" class="game-button">Reset Personal Data</button>
            </div>
          </div>
          <button id="closeLeaderboard" class="game-button">CLOSE</button>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Add event listeners
      document.getElementById('closeLeaderboard').addEventListener('click', () => this.toggleLeaderboard());
      document.getElementById('resetPersonalScores').addEventListener('click', () => this.resetPersonalScores());
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
        scoresList.innerHTML = '<div class="loading-message">Loading leaderboard data...</div>';
        return;
      }
      
      if (this.ui.error) {
        scoresList.innerHTML = `<div class="error-message">${this.ui.error}</div>`;
        
        // But still show scores if we have them
        if (this.topScores.length > 0) {
          scoresList.innerHTML += '<div class="warning-message">Showing cached data:</div>';
        } else {
          return;
        }
      }
      
      // Render top scores
      let scoresHTML = '';
      
      if (this.topScores.length === 0) {
        scoresHTML = '<div class="empty-message">No scores yet. Be the first to make the leaderboard!</div>';
      } else {
        this.topScores.forEach((score, index) => {
          const rank = index + 1;
          let rankClass = '';
          
          if (rank === 1) rankClass = 'rank-gold';
          else if (rank <= 10) rankClass = 'rank-blue';
          else rankClass = 'rank-red';
          
          // Check if this is the current player
          const isCurrentPlayer = playerName && score.name === playerName;
          const playerClass = isCurrentPlayer ? 'current-player' : '';
          
          scoresHTML += `
            <div class="score-row ${playerClass}">
              <div class="rank ${rankClass}">${rank}</div>
              <div class="name">${score.name}</div>
              <div class="score">${score.score}</div>
              <div class="date">${score.date}</div>
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
    },
  };
  
  // Initialize the leaderboard when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a short delay to ensure the game is fully loaded
    setTimeout(() => {
      LEADERBOARD.initialize();
    }, 1000);
  });
  
  // Add a method to the game over function to submit scores
  const originalGameOver = window.gameOver;
  window.gameOver = function(message) {
    // Call the original gameOver function
    if (originalGameOver) {
      originalGameOver(message);
    }
    
    // Submit the score to the leaderboard
    if (PLAYER && typeof PLAYER.score !== 'undefined') {
      LEADERBOARD.submitScore(playerName, PLAYER.score);
    }
  };
