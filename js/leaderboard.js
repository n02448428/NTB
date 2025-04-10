/* ------------------ LEADERBOARD SYSTEM WITH DEBUG ------------------ */

// Leaderboard configuration - REPLACE THESE VALUES with your actual credentials
const LEADERBOARD = {
    // Google Sheets configuration - YOU MUST CONFIGURE THESE
    config: {
      // The URL to your deployed Google Apps Script
      appScriptUrl: 'https://script.google.com/macros/library/d/1IMKJ9tS8HdM04V-mTj9Vj95JQFk2nyeuyN9LH4dHtx2gJ7fbx9LBP2Yg/4https://script.google.com/macros/s/AKfycbwnhyUcqvJ08hJH96Gq8mT6ueaVvx4LTG_mAD06RUndnpoHSB30gty_slSDnF6GM0iJoA/exec',
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
      console.log('[LEADERBOARD] Initializing leaderboard system...');
      
      // Load personal scores from local storage
      this.loadPersonalScores();
      
      // Create UI elements
      this.createLeaderboardButton();
      this.createLeaderboardOverlay();
      
      // Setup game over hook immediately
      this.setupGameOverHook();
      
      // Direct hook into PLAYER object to watch for score changes
      this.setupPlayerWatcher();
      
      // Fallback to local mode for now
      this.fallbackToLocalMode();
      
      console.log('[LEADERBOARD] Initialization complete');
      
      // Check existing scores
      console.log('[LEADERBOARD] Current topScores:', this.topScores);
      console.log('[LEADERBOARD] Current personalScores:', this.personalScores);
    },
    
    // Watch PLAYER object for changes
    setupPlayerWatcher: function() {
      console.log('[LEADERBOARD] Setting up player watcher');
      
      // Check if PLAYER exists
      if (window.PLAYER) {
        console.log('[LEADERBOARD] PLAYER object found:', window.PLAYER);
        
        // Set interval to periodically check if player score changes
        setInterval(() => {
          if (window.PLAYER && typeof window.PLAYER.score !== 'undefined' && window.CONFIG && window.CONFIG.STATE) {
            // Only log when game is over to avoid spam
            if (window.CONFIG.STATE.isGameOver) {
              console.log('[LEADERBOARD] Current player score:', window.PLAYER.score);
            }
          }
        }, 1000); // Check every second
      } else {
        console.log('[LEADERBOARD] PLAYER object not found, will retry');
        setTimeout(() => this.setupPlayerWatcher(), 2000);
      }
    },
    
    // Setup hook for game over to submit scores
    setupGameOverHook: function() {
      console.log('[LEADERBOARD] Setting up game over hook');
      
      // Store a reference to this for closures
      const self = this;
      
      // Direct hook into the window.gameOver function
      const originalGameOver = window.gameOver;
      window.gameOver = function(message) {
        console.log('[LEADERBOARD] Game over detected with message:', message);
        
        // Capture score and name before potential reset
        let score = 0;
        let name = 'Anonymous';
        
        if (window.PLAYER && typeof window.PLAYER.score !== 'undefined') {
          score = window.PLAYER.score;
          console.log('[LEADERBOARD] Captured score:', score);
          
          // Try different ways to get player name
          if (window.playerName) {
            name = window.playerName;
            console.log('[LEADERBOARD] Using window.playerName:', name);
          } else if (localStorage.getItem('neonTrailblazerPlayerName')) {
            name = localStorage.getItem('neonTrailblazerPlayerName');
            console.log('[LEADERBOARD] Using stored player name:', name);
          } else {
            console.log('[LEADERBOARD] No player name found, using Anonymous');
          }
        } else {
          console.log('[LEADERBOARD] PLAYER object or score not found');
          console.log('[LEADERBOARD] PLAYER:', window.PLAYER);
        }
        
        // Call original game over function
        if (originalGameOver) {
          console.log('[LEADERBOARD] Calling original gameOver function');
          originalGameOver(message);
        } else {
          console.log('[LEADERBOARD] Original gameOver function not found');
        }
        
        // Submit score - even if it's 0, for testing
        console.log('[LEADERBOARD] Submitting score:', score, 'for player:', name);
        self.submitScore(name, score);
      };
      
      console.log('[LEADERBOARD] Game over hook installed');
      
      // Add an additional hook for gameOver in window scope
      window.LEADERBOARD_submitScore = function(name, score) {
        console.log('[LEADERBOARD] Manual score submission:', score, 'for player:', name);
        self.submitScore(name, score);
      };
      console.log('[LEADERBOARD] Added window.LEADERBOARD_submitScore function for manual testing');
    },
    
    // Fallback to local data if the server can't be reached
    fallbackToLocalMode: function() {
      console.log('[LEADERBOARD] Using local data mode');
      // Start with empty leaderboard
      this.topScores = [];
    },
    
    // Submit a new score to the leaderboard
    submitScore: function(playerName, score) {
      console.log('[LEADERBOARD] submitScore called with:', playerName, score);
      
      // Add to personal scores
      const timestamp = new Date().toISOString();
      const dateStr = new Date().toLocaleDateString();
      
      const scoreObj = {
        timestamp: timestamp,
        name: playerName,
        score: score,
        date: dateStr,
        isHighScore: true // All scores are high scores initially
      };
      
      console.log('[LEADERBOARD] Created score object:', scoreObj);
      
      // Update session stats
      this.updatePlayerStats(score);
      
      // Add to personal scores
      this.personalScores.unshift(scoreObj);
      console.log('[LEADERBOARD] Added to personal scores, new count:', this.personalScores.length);
      
      // Keep only the latest 100 scores
      if (this.personalScores.length > 100) {
        this.personalScores = this.personalScores.slice(0, 100);
      }
      
      // Save to local storage
      this.savePersonalScores();
      
      // ALWAYS add to topScores
      console.log('[LEADERBOARD] Adding to top scores');
      this.topScores.push({...scoreObj});
      this.topScores.sort((a, b) => b.score - a.score);
      
      // Keep only top 50
      if (this.topScores.length > 50) {
        this.topScores = this.topScores.slice(0, 50);
      }
      
      console.log('[LEADERBOARD] New top scores count:', this.topScores.length);
      console.log('[LEADERBOARD] Top scores updated:', this.topScores);
      
      // Update the UI if leaderboard is visible
      if (this.ui.visible) {
        console.log('[LEADERBOARD] Updating UI (visible)');
        this.updateLeaderboardUI();
      } else {
        console.log('[LEADERBOARD] Not updating UI (not visible)');
      }
      
      return true;
    },
    
    // Load personal scores from local storage
    loadPersonalScores: function() {
      console.log('[LEADERBOARD] Loading personal scores from storage');
      const savedScores = localStorage.getItem(this.storageKeys.personalScores);
      if (savedScores) {
        try {
          this.personalScores = JSON.parse(savedScores);
          console.log('[LEADERBOARD] Loaded personal scores:', this.personalScores.length);
          this.calculatePlayerStats();
        } catch (e) {
          console.error('[LEADERBOARD] Error parsing saved scores:', e);
          this.personalScores = [];
        }
      } else {
        console.log('[LEADERBOARD] No personal scores found in storage');
        this.personalScores = [];
      }
    },
    
    // Save personal scores to local storage
    savePersonalScores: function() {
      console.log('[LEADERBOARD] Saving personal scores to storage, count:', this.personalScores.length);
      localStorage.setItem(
        this.storageKeys.personalScores, 
        JSON.stringify(this.personalScores)
      );
    },
    
    // Reset personal scores
    resetPersonalScores: function() {
      if (confirm('Are you sure you want to reset all scores? This will clear both personal and leaderboard data.')) {
        console.log('[LEADERBOARD] Resetting all scores');
        this.personalScores = [];
        this.topScores = [];
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
      console.log('[LEADERBOARD] Calculating player stats from', this.personalScores.length, 'scores');
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
      
      console.log('[LEADERBOARD] Player stats calculated:', this.playerStats);
    },
    
    // Update player stats with a new score
    updatePlayerStats: function(score) {
      console.log('[LEADERBOARD] Updating player stats with score:', score);
      this.playerStats.lastScore = score;
      this.playerStats.gamesPlayed++;
      
      if (score > this.playerStats.sessionHighScore) {
        this.playerStats.sessionHighScore = score;
      }
      
      // Recalculate average
      const totalScores = this.personalScores.reduce((sum, s) => sum + s.score, 0) + score;
      this.playerStats.averageScore = Math.round(totalScores / this.playerStats.gamesPlayed);
      
      console.log('[LEADERBOARD] Updated player stats:', this.playerStats);
    },
    
    // Show/hide the leaderboard
    toggleLeaderboard: function() {
      console.log('[LEADERBOARD] Toggling leaderboard visibility');
      this.ui.visible = !this.ui.visible;
      
      console.log('[LEADERBOARD] Leaderboard visible:', this.ui.visible);
      console.log('[LEADERBOARD] Current top scores count:', this.topScores.length);
      
      // Always update UI when toggling
      this.updateLeaderboardUI();
    },
    
    // Create the leaderboard button
    createLeaderboardButton: function() {
      console.log('[LEADERBOARD] Creating leaderboard button');
      
      // Check if button already exists
      if (document.getElementById('leaderboardButton')) {
        console.log('[LEADERBOARD] Button already exists');
        return;
      }
      
      const button = document.createElement('button');
      button.id = 'leaderboardButton';
      button.textContent = 'LEADERBOARD';
      button.className = 'game-button';
      
      // Position it near the EFX button
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
      
      // Bind to this object's toggleLeaderboard
      const self = this;
      button.addEventListener('click', function() {
        self.toggleLeaderboard();
      });
      
      document.body.appendChild(button);
      
      console.log('[LEADERBOARD] Button created and added to DOM');
    },
    
    // Create the leaderboard overlay
    createLeaderboardOverlay: function() {
      console.log('[LEADERBOARD] Creating leaderboard overlay');
      
      // Check if overlay already exists
      if (document.getElementById('leaderboardOverlay')) {
        console.log('[LEADERBOARD] Overlay already exists');
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
                <div style="text-align: center; padding: 20px; color: #0ff;">No scores yet. Be the first to make the leaderboard!</div>
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
              <button id="resetPersonalScores" style="margin-top: auto; padding: 8px 15px; background: transparent; border: 1px solid #ff3366; color: #ff3366; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #ff3366; font-size: 14px;">Reset All Scores</button>
              
              <!-- For debugging -->
              <button id="addDebugScore" style="margin-top: 10px; padding: 8px 15px; background: transparent; border: 1px solid #ffaa00; color: #ffaa00; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #ffaa00; font-size: 14px;">Add Test Score</button>
            </div>
          </div>
          <button id="closeLeaderboard" style="margin-top: 20px; align-self: center; padding: 10px 30px; font-size: 16px; background: transparent; border: 2px solid #0ff; color: #0ff; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #0ff;">CLOSE</button>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Add event listeners with proper binding to this object
      const self = this;
      document.getElementById('closeLeaderboard').addEventListener('click', function() {
        self.toggleLeaderboard();
      });
      
      document.getElementById('resetPersonalScores').addEventListener('click', function() {
        self.resetPersonalScores();
      });
      
      // Debug button
      document.getElementById('addDebugScore').addEventListener('click', function() {
        const playerName = window.playerName || localStorage.getItem('neonTrailblazerPlayerName') || 'DebugPlayer';
        const debugScore = Math.floor(Math.random() * 1000);
        console.log('[LEADERBOARD] Adding debug score:', debugScore);
        self.submitScore(playerName, debugScore);
        self.updateLeaderboardUI();
      });
      
      console.log('[LEADERBOARD] Overlay created and added to DOM');
    },
    
    // Update the leaderboard UI
    updateLeaderboardUI: function() {
      console.log('[LEADERBOARD] Updating leaderboard UI');
      console.log('[LEADERBOARD] Current top scores:', this.topScores);
      
      const overlay = document.getElementById('leaderboardOverlay');
      if (!overlay) {
        console.log('[LEADERBOARD] Overlay not found');
        return;
      }
      
      // Show/hide the overlay
      overlay.style.display = this.ui.visible ? 'flex' : 'none';
      
      if (!this.ui.visible) {
        console.log('[LEADERBOARD] Overlay hidden, not updating content');
        return;
      }
      
      // Update scores list
      const scoresList = document.getElementById('leaderboardScoresList');
      if (!scoresList) {
        console.log('[LEADERBOARD] Scores list element not found');
        return;
      }
      
      console.log('[LEADERBOARD] Rendering scores list with', this.topScores.length, 'scores');
      
      // Render top scores
      let scoresHTML = '';
      
      if (this.topScores.length === 0) {
        console.log('[LEADERBOARD] No scores to display');
        scoresHTML = '<div style="text-align: center; padding: 20px; color: #0ff;">No scores yet. Be the first to make the leaderboard!</div>';
      } else {
        // Get current player name
        const currentPlayerName = window.playerName || localStorage.getItem('neonTrailblazerPlayerName') || '';
        console.log('[LEADERBOARD] Current player name:', currentPlayerName);
        
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
      
      console.log('[LEADERBOARD] Setting scores HTML');
      scoresList.innerHTML = scoresHTML;
      
      // Update player stats
      const sessionHighScore = document.getElementById('sessionHighScore');
      const lastScore = document.getElementById('lastScore');
      const averageScore = document.getElementById('averageScore');
      const gamesPlayed = document.getElementById('gamesPlayed');
      
      if (sessionHighScore) sessionHighScore.textContent = this.playerStats.sessionHighScore;
      if (lastScore) lastScore.textContent = this.playerStats.lastScore;
      if (averageScore) averageScore.textContent = this.playerStats.averageScore;
      if (gamesPlayed) gamesPlayed.textContent = this.playerStats.gamesPlayed;
      
      console.log('[LEADERBOARD] UI update complete');
    }
  };
  
  // Initialize the leaderboard when the page loads
  window.addEventListener('load', function() {
    console.log('[LEADERBOARD] Window load event, initializing leaderboard');
    LEADERBOARD.initialize();
    
    // Also create a global reference for debugging
    window.LEADERBOARD_SYSTEM = LEADERBOARD;
  });
