/* ------------------ GAME CONTROLS ------------------ */

function setupControls() {
  console.log("Setting up controls");
  
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
        console.log("LEFT ARROW pressed - turning LEFT");
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
      }
      break;
    case 39: // Right arrow => turn right
      if (!CONFIG.STATE.isPaused) {
        console.log("RIGHT ARROW pressed - turning RIGHT");
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
  console.log("Setting up touch controls with debugging");
  
  // Clear any existing touch handlers by cloning and replacing elements
  const gameContainer = document.getElementById('gameContainer');
  const touchControls = document.getElementById('touchControls');
  
  // Remove old event listeners by cloning
  const newTouchControls = touchControls.cloneNode(true);
  if (touchControls.parentNode) {
    touchControls.parentNode.replaceChild(newTouchControls, touchControls);
  }
  
  // Get the new elements
  const leftZone = document.getElementById('leftTouchZone');
  const rightZone = document.getElementById('rightTouchZone');
  
  // Global touch tracking variables
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let touchMoveDistance = 0;
  let lastSwipeTime = 0;
  const SWIPE_COOLDOWN = 300; // milliseconds
  
  // To track if a touch is being processed as a swipe
  const SWIPE_THRESHOLD = 50; // Pixels
  
  // Simple turning functions for consistency
  function turnLeft() {
    console.log("TURNING LEFT - Vector: (z, 0, -x)");
    PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
  }
  
  function turnRight() {
    console.log("TURNING RIGHT - Vector: (-z, 0, x)");
    PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
  }
  
  // Handle touch start - capture starting position
  gameContainer.addEventListener('touchstart', function(e) {
    console.log("Touch START on gameContainer");
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
    touchMoveDistance = 0;
    
    // We won't prevent default here to allow other touch handlers to work
  }, { passive: true });
  
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
    
    // Debug
    console.log(`Touch MOVE - deltaX: ${deltaX.toFixed(2)}, deltaY: ${deltaY.toFixed(2)}, distance: ${touchMoveDistance.toFixed(2)}`);
    
    // If moved far enough and mostly horizontal, mark as swiping
    if (touchMoveDistance > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      // Check if we're still in cooldown
      const now = Date.now();
      if (now - lastSwipeTime < SWIPE_COOLDOWN) {
        console.log("Ignoring swipe - in cooldown period");
        return;
      }
      
      isSwiping = true;
      lastSwipeTime = now;
      
      // Process the swipe immediately for better responsiveness
      if (deltaX > 0) {
        // Right swipe (left to right) - turning RIGHT
        console.log("RIGHT SWIPE detected (left to right) - turning RIGHT");
        turnRight();
      } else {
        // Left swipe (right to left) - turning LEFT
        console.log("LEFT SWIPE detected (right to left) - turning LEFT");
        turnLeft();
      }
      
      // Reset start position to prevent multiple swipes in the same gesture
      touchStartX = touchX;
      touchStartY = touchY;
      
      // Stop propagation to prevent double handling
      e.stopPropagation();
    }
    
    // Only prevent default scrolling if we're swiping
    if (touchMoveDistance > 20) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Handle touch end for taps
  gameContainer.addEventListener('touchend', function(e) {
    console.log("Touch END on gameContainer");
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    // If not processed as a swipe and the movement was minimal, treat as a tap
    if (!isSwiping && touchMoveDistance < 10) {
      // Determine which side of the screen was tapped
      const touchX = e.changedTouches[0].clientX;
      const halfWidth = window.innerWidth / 2;
      
      if (touchX < halfWidth) {
        // Left side tapped
        console.log("LEFT TAP detected - turning LEFT");
        turnLeft();
      } else {
        // Right side tapped
        console.log("RIGHT TAP detected - turning RIGHT");
        turnRight();
      }
    }
  }, { passive: true });
  
  // Simple tap handlers for left/right zones
  leftZone.addEventListener('click', function(e) {
    console.log("LEFT ZONE clicked");
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    turnLeft();
    e.stopPropagation();
  });
  
  rightZone.addEventListener('click', function(e) {
    console.log("RIGHT ZONE clicked");
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    turnRight();
    e.stopPropagation();
  });
  
  // Prevent scrolling on touch zones when moving
  newTouchControls.addEventListener('touchmove', function(e) {
    // Only prevent default when game is running
    if (CONFIG.STATE.gameStarted && !CONFIG.STATE.isPaused && !CONFIG.STATE.isGameOver) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Update control instructions
  const controlsInfo = document.getElementById('controlsInfo');
  if (controlsInfo) {
    controlsInfo.innerHTML = `
      <p>DESKTOP: Arrow keys to turn, R to restart, P to pause, E for effects</p>
      <p>MOBILE: Tap left/right sides or swipe left/right to turn</p>
    `;
  }
  
  console.log("Touch controls setup complete");
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
