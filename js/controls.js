/* ------------------ GAME CONTROLS ------------------ */

function setupControls() {
  // Keyboard controls
  document.addEventListener('keydown', onKeyDown);
  
  // Touch controls for mobile
  if (CONFIG.IS_MOBILE) {
    setupTouchControls();
    addSwipeControls(); // Add separate swipe controls
  }
  
  // Pause button
  document.getElementById('pauseButton').addEventListener('click', togglePause);
  document.getElementById('resumeButton').addEventListener('click', togglePause);
}

function onKeyDown(event) {
  if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isGameOver && event.keyCode !== 82) return;

  switch (event.keyCode) {
    case 37: // Left arrow => turn left
      if (!CONFIG.STATE.isPaused) {
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
      }
      break;
    case 39: // Right arrow => turn right
      if (!CONFIG.STATE.isPaused) {
        PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
      }
      break;
    case 82: // R key => restart
      GAME.restartGame();
      break;
    case 80: // P key => pause/unpause
      togglePause();
      break;
    case 69: // E key => toggle effects panel
      const panel = document.getElementById('effectsPanel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      break;
  }
}

function setupTouchControls() {
  const leftZone = document.getElementById('leftTouchZone');
  const rightZone = document.getElementById('rightTouchZone');
  
  // Simple tap controls
  leftZone.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!CONFIG.STATE.isPaused && !CONFIG.STATE.isGameOver && CONFIG.STATE.gameStarted) {
      PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
    }
  });

  rightZone.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!CONFIG.STATE.isPaused && !CONFIG.STATE.isGameOver && CONFIG.STATE.gameStarted) {
      PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
    }
  });
  
  // Update control instructions
  const controlsInfo = document.getElementById('controlsInfo');
  if (controlsInfo) {
    controlsInfo.innerHTML = `
      <p>DESKTOP: Arrow keys to turn, R to restart, P to pause, E for effects</p>
      <p>MOBILE: Tap left/right sides or swipe left/right to turn</p>
    `;
  }
}

// In the addSwipeControls function, we need to make sure the swipe is detected properly
function addSwipeControls() {
  const gameContainer = document.getElementById('gameContainer');
  
  // Variables to track touch start position
  let touchStartX = 0;
  let touchStartY = 0;
  
  // Add touchstart listener to record start position
  gameContainer.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  
  // Add touchend listener to detect swipe
  gameContainer.addEventListener('touchend', function(e) {
    if (CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver || !CONFIG.STATE.gameStarted) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    // Calculate distance moved
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Detect horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Right swipe - turn LEFT
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
      } else {
        // Left swipe - turn RIGHT
        PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
      }
    }
  });
}

function togglePause() {
  if (!CONFIG.STATE.gameStarted) return;

  CONFIG.STATE.isPaused = !CONFIG.STATE.isPaused;

  const pauseButton = document.getElementById('pauseButton');
  const pauseOverlay = document.getElementById('pauseOverlay');

  if (CONFIG.STATE.isPaused) {
    pauseButton.textContent = 'RESUME';
    pauseOverlay.style.display = 'flex';
  } else {
    pauseButton.textContent = 'PAUSE';
    pauseOverlay.style.display = 'none';
  }
}

// Enhance the onKeyDown function to make E key work in all game states
const originalOnKeyDown = onKeyDown;
onKeyDown = function(event) {
  // Handle E key for effects panel toggle regardless of game state
  if (event.keyCode === 69) { // 'E' key
    const panel = document.getElementById('effectsPanel');
    if (panel) {
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      
      // Hide notification once opened
      if (panel.style.display === 'block') {
        document.documentElement.style.setProperty('--effect-badge-display', 'none');
        localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
      }
      
      // Don't pass to original handler for E key
      return;
    }
  }
  
  // Call the original handler for all other keys
  if (CONFIG.STATE.gameStarted || !CONFIG.STATE.isGameOver) {
    originalOnKeyDown(event);
  }
};
