/* ------------------ UI MANAGEMENT ------------------ */

let playerName = '';

function setupUI() {
  // Setup splash screen
  document.getElementById('startButton').addEventListener('click', startGame);
  document.getElementById('leaderboardButton').addEventListener('click', showLeaderboard);
  document.getElementById('closeLeaderboard').addEventListener('click', hideLeaderboard);
  document.getElementById('returnToMenuButton').addEventListener('click', GAME.restartGame);

  // Load saved player name if exists
  const savedName = localStorage.getItem('neonTrailblazerPlayerName') || '';
  document.getElementById('playerNameInput').value = savedName;
  
  // Show splash screen
  showSplashScreen();
}

function showSplashScreen() {
  document.getElementById('splashScreen').style.display = 'flex';
  
  // Show preview if available
  if (typeof PREVIEW !== 'undefined' && PREVIEW.showSplashPreview) {
    PREVIEW.showSplashPreview();
  }
}

function hideSplashScreen() {
  document.getElementById('splashScreen').style.display = 'none';
  
  // Hide preview if available
  if (typeof PREVIEW !== 'undefined' && PREVIEW.hideSplashPreview) {
    PREVIEW.hideSplashPreview();
  }
}

function startGame() {
  playerName = document.getElementById('playerNameInput').value.trim() || "PLAYER" + Math.floor(Math.random() * 1000);
  localStorage.setItem('neonTrailblazerPlayerName', playerName);

  document.getElementById('playerName').textContent = playerName;
  document.getElementById('playerScore').textContent = '0';

  hideSplashScreen();
  CONFIG.STATE.gameStarted = true;
  RENDERER.clock.start();

  RENDERER.updateCameraForOrientation();
  startGameWithMusic();
}

function gameOver(message) {
  CONFIG.STATE.isGameOver = true;
  if (AI.spawnInterval) clearInterval(AI.spawnInterval);

  document.getElementById('gameOverMessage').textContent = message;
  document.getElementById('finalScore').textContent = 'SCORE: ' + PLAYER.score;

  // Save the score to leaderboard - use try/catch to handle API errors
  try {
    addToLeaderboard(playerName, PLAYER.score);
  } catch (e) {
    console.error("Error saving score to leaderboard:", e);
    // Continue with game over even if leaderboard fails
  }

  // Show game over screen
  document.getElementById('gameOver').style.display = 'block';
}

// Update this function to properly reset the game
function showSplashScreen() {
  document.getElementById('splashScreen').style.display = 'flex';
  
  // Ensure the game is completely stopped
  CONFIG.STATE.gameStarted = false;
  
  // Show preview if available
  if (typeof PREVIEW !== 'undefined' && PREVIEW.showSplashPreview) {
    PREVIEW.showSplashPreview();
  }
}

function updateTouchControlsDisplay() {
  // Show touch controls only on mobile devices
  if (CONFIG.IS_MOBILE) {
    document.getElementById('touchControls').style.display = 'flex';
    
    // Update control instructions
    const controlsInfo = document.getElementById('controlsInfo');
    if (controlsInfo) {
      controlsInfo.innerHTML = `
        <p>DESKTOP: Arrow keys to turn, R to restart, P to pause, E for effects</p>
        <p>MOBILE: Tap left/right sides or swipe left/right to turn</p>
      `;
    }
  } else {
    document.getElementById('touchControls').style.display = 'none';
  }
}