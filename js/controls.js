/* Improved Swipe Controls with Better Separation from Taps */

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
  if (!CONFIG.STATE.gameStarted || (CONFIG.STATE.isGameOver && event.keyCode !== 82)) return;

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
  console.log("Setting up touch controls with improved swipe detection");
  
  // Get the elements we need
  const leftZone = document.getElementById('leftTouchZone');
  const rightZone = document.getElementById('rightTouchZone');
  const gameContainer = document.getElementById('gameContainer');
  
  // Global touch tracking variables
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let touchMoveDistance = 0;
  
  // To track if a touch is being processed as a swipe
  const SWIPE_THRESHOLD = 50; // Pixels
  
  // Handle touch start - capture starting position
  gameContainer.addEventListener('touchstart', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
    touchMoveDistance = 0;
    
    // Prevent default to avoid iOS double-tap zooming
    e.preventDefault();
  }, { passive: false });
  
  // Handle touch move - detect if swiping
  gameContainer.addEventListener('touchmove', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    // Calculate horizontal distance moved
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;
    
    // Update the total distance moved
    touchMoveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If moved far enough and mostly horizontal, mark as swiping
    if (touchMoveDistance > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = true;
      
      // Process the swipe immediately for better responsiveness
      if (deltaX > 0) {
        // Right swipe
        console.log("Right swipe detected, distance:", touchMoveDistance);
        PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
      } else {
        // Left swipe
        console.log("Left swipe detected, distance:", touchMoveDistance);
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
      }
      
      // Reset start position to prevent multiple swipes in the same gesture
      touchStartX = touchX;
      touchStartY = touchY;
    }
    
    // Prevent scrolling
    e.preventDefault();
  }, { passive: false });
  
  // Handle touch end
  gameContainer.addEventListener('touchend', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    // If not processed as a swipe and the movement was minimal, treat as a tap
    if (!isSwiping && touchMoveDistance < 10) {
      // Determine which side of the screen was tapped
      const touchX = e.changedTouches[0].clientX;
      const halfWidth = window.innerWidth / 2;
      
      if (touchX < halfWidth) {
        // Left side tapped
        console.log("Left tap detected");
        PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
      } else {
        // Right side tapped
        console.log("Right tap detected");
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
      }
    }
  }, { passive: false });
  
  // Also add separate handlers for the zone divs for more reliable taps
  leftZone.addEventListener('touchstart', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    // Remember this touch to check if it became a swipe
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  
  rightZone.addEventListener('touchstart', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    // Remember this touch to check if it became a swipe
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  
  leftZone.addEventListener('touchend', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    // Only process as tap if didn't move much
    if (!isSwiping && touchMoveDistance < 10) {
      console.log("Left zone tap detected");
      PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
    }
    e.preventDefault();
  }, { passive: false });
  
  rightZone.addEventListener('touchend', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    // Only process as tap if didn't move much
    if (!isSwiping && touchMoveDistance < 10) {
      console.log("Right zone tap detected");
      PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
    }
    e.preventDefault();
  }, { passive: false });
  
  // Make sure we prevent default scrolling on touch zones
  document.getElementById('touchControls').addEventListener('touchmove', function(e) {
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
  if (CONFIG.STATE.gameStarted || !CONFIG.STATE.isGameOver) {
    originalOnKeyDown(event);
  }
};
