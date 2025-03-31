/* Complete Rewrite of Touch Controls */

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
        turnLeft();
      }
      break;
    case 39: // Right arrow => turn right
      if (!CONFIG.STATE.isPaused) {
        turnRight();
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

// Define turn functions for consistency
function turnLeft() {
  console.log("TURN LEFT");
  PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
}

function turnRight() {
  console.log("TURN RIGHT");
  PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
}

function setupTouchControls() {
  console.log("Setting up SIMPLIFIED touch controls");
  
  // First, remove any existing touch listeners to prevent interference
  const gameContainer = document.getElementById('gameContainer');
  const newGameContainer = gameContainer.cloneNode(true);
  gameContainer.parentNode.replaceChild(newGameContainer, gameContainer);
  
  // Get the touch zones from the cloned container
  const leftZone = document.getElementById('leftTouchZone');
  const rightZone = document.getElementById('rightTouchZone');
  
  // Variables for tracking swipes
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let lastSwipeDirection = null;
  let lastSwipeTime = 0;
  
  // Constants
  const SWIPE_THRESHOLD = 40;
  const SWIPE_COOLDOWN = 500; // ms between swipes
  
  // Add swipe detection to the game container
  newGameContainer.addEventListener('touchstart', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
    
    e.preventDefault();
  }, { passive: false });
  
  // Clean swipe detection
  newGameContainer.addEventListener('touchmove', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    if (isSwiping) return; // Only process one swipe per touch
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;
    
    // Check if this is a significant horizontal movement
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      isSwiping = true;
      
      const now = Date.now();
      
      // Cooldown to prevent rapid swipes
      if (now - lastSwipeTime < SWIPE_COOLDOWN) {
        return;
      }
      
      lastSwipeTime = now;
      
      // Check swipe direction and turn
      if (deltaX > 0) {
        // Swipe RIGHT, so turn LEFT (this is the swap/fix)
        console.log("RIGHT SWIPE - deltaX:", deltaX);
        lastSwipeDirection = "right";
        turnLeft();
      } else {
        // Swipe LEFT, so turn RIGHT (this is the swap/fix)
        console.log("LEFT SWIPE - deltaX:", deltaX);
        lastSwipeDirection = "left";
        turnRight();
      }
    }
    
    e.preventDefault();
  }, { passive: false });
  
  // Direct tap zones for simple and reliable controls
  leftZone.addEventListener('click', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    console.log("LEFT TAP");
    turnLeft();
  });
  
  rightZone.addEventListener('click', function(e) {
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    console.log("RIGHT TAP");
    turnRight();
  });
  
  // Prevent scrolling on all touch zones
  document.getElementById('touchControls').addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  // Update control instructions
  const controlsInfo = document.getElementById('controlsInfo');
  if (controlsInfo) {
    controlsInfo.innerHTML = `
      <p>DESKTOP: Arrow keys to turn, R to restart, P to pause, E for effects</p>
      <p>MOBILE: Tap left/right sides or swipe left/right to turn (Swipe RIGHT = turn LEFT)</p>
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
