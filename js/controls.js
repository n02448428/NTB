/* Improved Touch Controls - Replace the content in js/controls.js */

function setupControls() {
  // Keyboard controls
  document.addEventListener('keydown', onKeyDown);
  
  // Touch controls for mobile
  if (CONFIG.IS_MOBILE) {
    setupTouchControls();
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
  const gameContainer = document.getElementById('gameContainer');
  
  // Variables to track touch
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  
  // Track touch start position
  gameContainer.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: false });
  
  // Handle touch movement (for swipe detection)
  gameContainer.addEventListener('touchmove', function(e) {
    if (CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver || !CONFIG.STATE.gameStarted) return;
    
    // Prevent default to avoid scrolling while swiping
    e.preventDefault();
  }, { passive: false });
  
  // Handle touch end
  gameContainer.addEventListener('touchend', function(e) {
    if (CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver || !CONFIG.STATE.gameStarted) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    // Calculate touch distance and duration
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const touchDuration = touchEndTime - touchStartTime;
    
    // Minimum distance and maximum duration for a swipe
    const minSwipeDistance = 50;
    const maxSwipeDuration = 300; // milliseconds
    
    // Check if movement is horizontal and qualifies as a swipe
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && 
                             Math.abs(deltaX) > minSwipeDistance &&
                             touchDuration < maxSwipeDuration;
    
    if (isHorizontalSwipe) {
      // This is a swipe - determine direction and turn
      if (deltaX > 0) {
        // Swipe right - turn right
        PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
      } else {
        // Swipe left - turn left
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
      }
      // Don't process as tap
      return;
    }
    
    // If not a swipe, check if it's a tap on left/right zones
    const rect = e.target.getBoundingClientRect();
    const x = e.changedTouches[0].clientX - rect.left;
    const tapThreshold = 10; // px movement allowed for a tap
    
    // Only count as tap if very little movement
    if (Math.abs(deltaX) < tapThreshold && Math.abs(deltaY) < tapThreshold) {
      // Check which side was tapped
      if (x < window.innerWidth / 2) {
        // Left side tapped
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
      } else {
        // Right side tapped
        PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
      }
    }
  }, { passive: false });
  
  // Prevent default touch behavior to avoid accidental scrolling
  leftZone.addEventListener('touchstart', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  rightZone.addEventListener('touchstart', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  // Update control instructions
  const controlsInfo = document.getElementById('controlsInfo');
  if (controlsInfo) {
    controlsInfo.innerHTML = `
      <p>DESKTOP: Arrow keys to turn, R to restart, P to pause, E for effects</p>
      <p>MOBILE: Tap left/right sides or swipe left/right to turn</p>
    `;
  }
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
  // Only if not in splash screen or game over state
  if (CONFIG.STATE.gameStarted || !CONFIG.STATE.isGameOver) {
    originalOnKeyDown(event);
  }
};
