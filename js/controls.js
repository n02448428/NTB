/* ------------------ GAME CONTROLS ------------------ */

function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', onKeyDown);
    
    // Touch controls for mobile
    if (CONFIG.IS_MOBILE) {
      setupTouchControls();
      addSwipeControls();
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
    let wasSwiped = false; // Flag to track if a swipe was detected
    
    // Track touch start position for the entire game
    gameContainer.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      wasSwiped = false; // Reset swipe flag on new touch
    });
    
    // Detect swipe on touch end
    gameContainer.addEventListener('touchend', function(e) {
      if (CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver || !CONFIG.STATE.gameStarted) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      // Calculate swipe direction
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Minimum pixels to count as a swipe
      const minSwipeDistance = 30;
      
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        wasSwiped = true; // Mark that we detected a swipe
        
        if (deltaX > 0) {
          // Swipe right - turn right
          PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
        } else {
          // Swipe left - turn left
          PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
        }
      }
    });
    
    // Convert tap controls to use touchend instead of touchstart
    leftZone.addEventListener('touchend', function(e) {
      e.preventDefault();
      
      // Only process as a tap if it wasn't a swipe
      if (!wasSwiped && !CONFIG.STATE.isPaused && !CONFIG.STATE.isGameOver && CONFIG.STATE.gameStarted) {
        // Check if the touch ended in the left zone
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const rect = leftZone.getBoundingClientRect();
        
        // Make sure the touch ended in the left zone
        if (touchEndX >= rect.left && touchEndX <= rect.right && 
            touchEndY >= rect.top && touchEndY <= rect.bottom) {
          PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
        }
      }
    });
  
    rightZone.addEventListener('touchend', function(e) {
      e.preventDefault();
      
      // Only process as a tap if it wasn't a swipe
      if (!wasSwiped && !CONFIG.STATE.isPaused && !CONFIG.STATE.isGameOver && CONFIG.STATE.gameStarted) {
        // Check if the touch ended in the right zone
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const rect = rightZone.getBoundingClientRect();
        
        // Make sure the touch ended in the right zone
        if (touchEndX >= rect.left && touchEndX <= rect.right && 
            touchEndY >= rect.top && touchEndY <= rect.bottom) {
          PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
        }
      }
    });
    
    // We also need to prevent default on touchstart to avoid browser behaviors
    leftZone.addEventListener('touchstart', function(e) {
      e.preventDefault();
    });
    
    rightZone.addEventListener('touchstart', function(e) {
      e.preventDefault();
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
// and doesn't conflict with the tap controls
function addSwipeControls() {
  const gameContainer = document.getElementById('gameContainer');
  
  // Instead of adding another touchstart listener, we should use the one from setupTouchControls
  // and just focus on touchend detection
  
  gameContainer.addEventListener('touchend', function(e) {
    if (CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver || !CONFIG.STATE.gameStarted) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    // Get the start position from the global variables set in setupTouchControls
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Increased minimum threshold for swipe detection
    const minSwipeDistance = 50; // Increased from 30 to make swipe more distinct from taps
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      // Set the wasSwiped flag to true BEFORE processing the swipe
      wasSwiped = true;
      
      if (deltaX > 0) {
        // Swipe right - turn right
        PLAYER.direction.set(-PLAYER.direction.z, 0, PLAYER.direction.x);
      } else {
        // Swipe left - turn left
        PLAYER.direction.set(PLAYER.direction.z, 0, -PLAYER.direction.x);
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
  // Only if not in splash screen or game over state
  if (CONFIG.STATE.gameStarted || !CONFIG.STATE.isGameOver) {
    originalOnKeyDown(event);
  }
};
