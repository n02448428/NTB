/* ------------------ LEADERBOARD SYSTEM ------------------ */

// Immediately executing function to avoid namespace conflicts
(function() {
    // Configuration - REPLACE THESE VALUES with your actual credentials
    const CONFIG = {
      // Google Sheets configuration
      appScriptUrl: 'https://script.google.com/macros/s/AKfycbwnhyUcqvJ08hJH96Gq8mT6ueaVvx4LTG_mAD06RUndnpoHSB30gty_slSDnF6GM0iJoA/exec', // Replace with your deployed Apps Script URL
      apiKey: 'dam-9789', // Replace with the API key you set in your Apps Script
      
      // Storage keys for local fallback
      storageKey: 'neonTrailblazerLeaderboard'
    };
    
    // Global score cache to preserve score between game over events
    let currentGameScore = 0;
    let leaderboardScores = [];
    
    // Get player name from DOM element
    function getPlayerName() {
      const playerNameElement = document.getElementById('playerName');
      if (playerNameElement) {
        return playerNameElement.textContent.trim();
      }
      return localStorage.getItem('neonTrailblazerPlayerName') || 'Anonymous';
    }
    
    // Set up interval to watch the score
    function watchPlayerScore() {
      setInterval(function() {
        if (window.PLAYER && typeof window.PLAYER.score !== 'undefined') {
          // Cache the score
          currentGameScore = window.PLAYER.score;
          console.log("[LEADERBOARD] Cached current score:", currentGameScore);
        }
      }, 500); // Check every half second
    }
    
    // Set up game over hook
    function setupGameOverHook() {
      // Store original function
      const originalGameOver = window.gameOver;
      
      // Replace with our version
      window.gameOver = function(message) {
        const finalScore = currentGameScore;
        const playerName = getPlayerName();
        
        console.log("[LEADERBOARD] Game over! Final score:", finalScore, "Player:", playerName);
        
        // Call original function
        if (originalGameOver) {
          originalGameOver(message);
        }
        
        // Add score to leaderboard
        addScore(playerName, finalScore);
        
        // Reset current game score
        currentGameScore = 0;
      };
      
      console.log("[LEADERBOARD] Game over hook installed");
    }
    
    // Load scores from local storage (fallback)
    function loadLocalScores() {
      try {
        const savedScores = localStorage.getItem(CONFIG.storageKey);
        return savedScores ? JSON.parse(savedScores) : [];
      } catch (e) {
        console.error("[LEADERBOARD] Error loading scores:", e);
        return [];
      }
    }
    
    // Save scores to local storage (fallback)
    function saveLocalScores(scores) {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(scores));
    }
    
    // Fetch scores from Google Sheets
    function fetchScores() {
      return fetch(CONFIG.appScriptUrl + '?action=getScores')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success && data.data) {
            const scores = data.data.slice(1); // Skip header row
            
            const parsedScores = scores.map(row => ({
              name: row[1] || 'Anonymous',
              score: parseInt(row[2], 10) || 0,
              date: row[3] || ''
            }));
            
            console.log("[LEADERBOARD] Fetched scores:", parsedScores.length);
            
            // Update global scores
            leaderboardScores = parsedScores;
            
            // Save to local storage as fallback
            saveLocalScores(parsedScores);
            
            // Update UI if leaderboard is visible
            if (document.getElementById('leaderboardOverlay').style.display === 'flex') {
              updateLeaderboardUI();
            }
            
            return parsedScores;
          }
          
          throw new Error("Invalid data format from server");
        })
        .catch(error => {
          console.error("[LEADERBOARD] Error fetching scores:", error);
          
          // Fall back to local storage
          console.log("[LEADERBOARD] Using local scores as fallback");
          leaderboardScores = loadLocalScores();
          
          // Update UI if leaderboard is visible
          if (document.getElementById('leaderboardOverlay').style.display === 'flex') {
            updateLeaderboardUI();
          }
          
          return leaderboardScores;
        });
    }
    
    // Submit score to Google Sheets
    function submitScore(name, score) {
      const date = new Date().toLocaleDateString();
      
      const data = {
        action: 'submitScore',
        apiKey: CONFIG.apiKey,
        timestamp: new Date().toISOString(),
        name: name,
        score: score,
        date: date
      };
      
      return fetch(CONFIG.appScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        if (result.success) {
          console.log("[LEADERBOARD] Score submitted successfully");
          // Refresh scores from server
          return fetchScores();
        } else {
          console.error("[LEADERBOARD] Error submitting score:", result.error);
          throw new Error(result.error || "Unknown error");
        }
      })
      .catch(error => {
        console.error("[LEADERBOARD] Error submitting score:", error);
        
        // Fall back to local storage
        const newScore = { name, score, date };
        
        // Add to local scores
        leaderboardScores.push(newScore);
        
        // Sort by score (highest first)
        leaderboardScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 50
        if (leaderboardScores.length > 50) {
          leaderboardScores = leaderboardScores.slice(0, 50);
        }
        
        // Save to local storage
        saveLocalScores(leaderboardScores);
        
        // Update UI if leaderboard is visible
        if (document.getElementById('leaderboardOverlay').style.display === 'flex') {
          updateLeaderboardUI();
        }
        
        return Promise.resolve(false);
      });
    }
    
    // Add a score to the leaderboard
    function addScore(name, score) {
      console.log("[LEADERBOARD] Adding score:", score, "for player:", name);
      
      // Submit score to Google Sheets
      submitScore(name, score)
        .then(success => {
          console.log("[LEADERBOARD] Score added to leaderboard", success ? "successfully" : "with fallback");
        });
      
      return true;
    }
    
    // Add test score (limited to 10 max)
    function addTestScore() {
      const playerName = getPlayerName();
      const testScore = Math.floor(Math.random() * 10) + 1; // Random score 1-10
      addScore(playerName, testScore);
    }
    
    // Reset scores (just local)
    function resetLocalScores() {
      if (confirm('Are you sure you want to reset your local leaderboard? This will only clear your browser data, not the global leaderboard.')) {
        // Clear local storage
        localStorage.removeItem(CONFIG.storageKey);
        
        // Refresh from server
        fetchScores();
      }
    }
    
    // Calculate player stats
    function calculatePlayerStats() {
      const playerName = getPlayerName();
      
      // Filter for current player
      const playerScores = leaderboardScores.filter(s => s.name === playerName);
      
      if (playerScores.length === 0) {
        return {
          highScore: 0,
          lastScore: 0,
          averageScore: 0,
          gamesPlayed: 0,
          bestRank: '-'
        };
      }
      
      // Calculate stats
      const highScore = Math.max(...playerScores.map(s => s.score));
      const lastScore = playerScores[0].score;
      const totalScore = playerScores.reduce((sum, s) => sum + s.score, 0);
      const averageScore = Math.round(totalScore / playerScores.length);
      
      // Find best rank
      let bestRank = '-';
      for (let i = 0; i < leaderboardScores.length; i++) {
        if (leaderboardScores[i].name === playerName) {
          bestRank = i + 1;
          break;
        }
      }
      
      return {
        highScore,
        lastScore,
        averageScore,
        gamesPlayed: playerScores.length,
        bestRank
      };
    }
    
    // Toggle leaderboard visibility
    function toggleLeaderboard() {
      const overlay = document.getElementById('leaderboardOverlay');
      const currentlyVisible = overlay.style.display === 'flex';
      overlay.style.display = currentlyVisible ? 'none' : 'flex';
      
      if (!currentlyVisible) {
        // When showing, refresh from server
        fetchScores().then(() => {
          updateLeaderboardUI();
        });
      }
    }
    
    // Update leaderboard UI
    function updateLeaderboardUI() {
      const playerName = getPlayerName();
      const stats = calculatePlayerStats();
      
      // Update scores list
      const scoresList = document.getElementById('leaderboardScoresList');
      
      let scoresHTML = '';
      if (leaderboardScores.length === 0) {
        scoresHTML = '<div style="text-align: center; padding: 20px; color: #0ff;">No scores yet. Be the first to make the leaderboard!</div>';
      } else {
        leaderboardScores.forEach((score, index) => {
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
          const isCurrentPlayer = score.name === playerName;
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
      document.getElementById('sessionHighScore').textContent = stats.highScore;
      document.getElementById('lastScore').textContent = stats.lastScore;
      document.getElementById('averageScore').textContent = stats.averageScore;
      document.getElementById('gamesPlayed').textContent = stats.gamesPlayed;
      document.getElementById('playerRank').textContent = stats.bestRank;
    }
    
    // Create UI elements
    function createUI() {
      // Create button if not exists
      if (!document.getElementById('leaderboardButton')) {
        const button = document.createElement('button');
        button.id = 'leaderboardButton';
        button.textContent = 'LEADERBOARD';
        
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
        
        button.addEventListener('click', toggleLeaderboard);
        document.body.appendChild(button);
      }
      
      // Create overlay if not exists
      if (!document.getElementById('leaderboardOverlay')) {
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
                  <div style="color: #0ff;">High Score:</div>
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
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid rgba(0, 255, 255, 0.2);">
                  <div style="color: #0ff;">Your Rank:</div>
                  <div id="playerRank" style="font-weight: bold; color: #fff; text-shadow: 0 0 5px #0ff;">-</div>
                </div>
                <button id="resetLocalScores" style="margin-top: auto; padding: 8px 15px; background: transparent; border: 1px solid #ff3366; color: #ff3366; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #ff3366; font-size: 14px;">Reset Local Scores</button>
                
                <!-- For debugging - add a small test score (1-10) -->
                <button id="addTestScore" style="margin-top: 10px; padding: 8px 15px; background: transparent; border: 1px solid #ffaa00; color: #ffaa00; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #ffaa00; font-size: 14px;">Add Test Score (1-10)</button>
              </div>
            </div>
            <button id="closeLeaderboard" style="margin-top: 20px; align-self: center; padding: 10px 30px; font-size: 16px; background: transparent; border: 2px solid #0ff; color: #0ff; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #0ff;">CLOSE</button>
          </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listeners
        document.getElementById('closeLeaderboard').addEventListener('click', toggleLeaderboard);
        document.getElementById('resetLocalScores').addEventListener('click', resetLocalScores);
        document.getElementById('addTestScore').addEventListener('click', addTestScore);
      }
    }
    
    // Initialize the system
    function init() {
      console.log("[LEADERBOARD] Initializing leaderboard system with Google Sheets");
      
      // Create UI
      createUI();
      
      // Watch for player score changes
      watchPlayerScore();
      
      // Set up game over hook
      setupGameOverHook();
      
      // Fetch initial scores
      fetchScores();
      
      console.log("[LEADERBOARD] Leaderboard system ready");
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
