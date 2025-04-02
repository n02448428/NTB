/* ------------------ MAIN GAME LOGIC ------------------ */

// Game manager object
const GAME = {
    init,
    animate,
    restartGame
  };
  
// Initialize the game
function init() {
  // Request higher frame rate on mobile devices that support it
  if ('setHighFrameRateMode' in window) {
    window.setHighFrameRateMode(true);
  }
  
  // For iOS devices
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }
  
  // Make sure the renderer is initialized first
  if (!window.RENDERER || !window.RENDERER.scene) {
    console.log("Initializing renderer first");
    RENDERER.initRenderer();
  }
  
  // Initialize world
  try {
    console.log("Creating world boundaries");
    createWorldBoundaries();
    console.log("Creating sponsor messages");
    createSponsorMessages();
  } catch (e) {
    console.error("Error creating world:", e);
  }
    
    // Initialize player
    createPlayerBike();
    
    // Initialize AI
    createAIBike();
    
    // Create initial game objects
    for (let i = 0; i < 150; i++) createObstacle();
    for (let i = 0; i < 30; i++) createPowerup();
    
    // Setup portals
    setupPortals();

    // Initialize collision system (add this line)
  if (window.COLLISIONS) {
    console.log("Initializing collision system");
    COLLISIONS.initCollisionBoxes();
  }

  // Initialize ghost wireframe UI if available
if (window.COLLISIONS && typeof COLLISIONS.initGhostWireframeUI === 'function') {
  COLLISIONS.initGhostWireframeUI();
}
    
    // Setup UI elements
    setupUI();
    
    // Setup effects panel
    setupEffectsPanel();
    
    // Setup music
    setupMusicControls();
    
    // Setup online leaderboard with safety check:
if (typeof setupOnlineLeaderboard === 'function') {
  setupOnlineLeaderboard();
} else {
  console.warn("setupOnlineLeaderboard function not found, using default leaderboard");
  // Fallback to default leaderboard if needed
}
    
    // Setup controls
    setupControls();
    
    // Update camera orientation
    RENDERER.updateCameraForOrientation();
    
    // Update touch controls display
    updateTouchControlsDisplay();
    
    // Start AI spawn timer
    startAISpawnTimer();
    
    // Start the animation loop
    animate();
  }
  
  // Main animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Render scene
    RENDERER.render();
    
    // If not started, paused, or game over, don't update game state
    if (!CONFIG.STATE.gameStarted || CONFIG.STATE.isPaused || CONFIG.STATE.isGameOver) return;
    
    // Update player
    updatePlayerMovement();
    
    // Check for player collisions
    if (window.COLLISIONS) {
      COLLISIONS.updateCollisions();
    } else {
      // Fallback to old collision check if COLLISIONS is not available
      const playerCollision = checkPlayerCollisions();
      if (playerCollision.collision) {
        gameOver("GAME OVER - " + playerCollision.reason.toUpperCase());
        return;
      }
    }
    
    // Update AI
    updateAIMovement();
    
    // Update powerups - only if not using COLLISIONS
  if (!window.COLLISIONS) {
    checkPowerups();
  }
  updatePowerupAnimations(RENDERER.clock.getElapsedTime());
    
    // Update camera to follow player
    updatePlayerCamera();
  }
  
  // Restart the game
  function restartGame() {
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
  
    // Clean up old objects
    RENDERER.scene.remove(PLAYER.bike);
    
    // Reset player and AI
    resetPlayer();
    resetAI();
    
    // Remove obstacles except walls
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      // Keep boundary walls but remove other obstacles
      if (
        !(obstacle.geometry.type === 'BoxGeometry' &&
          (Math.abs(obstacle.position.x) === CONFIG.WORLD_SIZE / 2 ||
            Math.abs(obstacle.position.z) === CONFIG.WORLD_SIZE / 2))
      ) {
        RENDERER.scene.remove(obstacle);
        obstacles.splice(i, 1);
      }
    }
    
    // Reset powerups
    initPowerups();
    
    // Reset game state
    CONFIG.STATE.isGameOver = false;
    CONFIG.STATE.gameStarted = false;  // Important: set to false
    
    // Unpause if paused
    if (CONFIG.STATE.isPaused) togglePause();
    
    // Create new player and AI but don't start moving
    createPlayerBike();
    
    // Create new obstacles
    for (let i = 0; i < 80; i++) createObstacle();
    
    // Restart AI spawn timer (will only activate when game starts)
    startAISpawnTimer();
    
    // Return to splash screen
    showSplashScreen();
    
    // Reinitialize collision system
    if (window.COLLISIONS) {
      COLLISIONS.initCollisionBoxes();
    }

    // Initialize ghost wireframe UI if available
if (window.COLLISIONS && typeof COLLISIONS.initGhostWireframeUI === 'function') {
  COLLISIONS.initGhostWireframeUI();
}

// Make sure COLLISIONS is globally accessible
window.COLLISIONS = COLLISIONS;
  }
  
  // Call init when the page loads
  window.addEventListener('load', init);

  // Make sure COLLISIONS is globally accessible
window.COLLISIONS = COLLISIONS;

// Initialize all our enhancements
document.addEventListener('DOMContentLoaded', function() {
  // Wait for the game to fully initialize
  setTimeout(function() {
    // Make credit text clickable
    enhanceCreditText();
    
    // Fix effects panel toggle
    fixEffectsToggle();
    
    // Setup EFX badge visibility
    setupEffectsPanelBadge();
  }, 1000);
});

// Make sure the credit text is clickable
function enhanceCreditText() {
  const creditText = document.getElementById('creditText');
  if (creditText) {
    // Wrap the entire credit text in an anchor tag
    creditText.innerHTML = '<a id="creditTextLink" href="https://twitter.com/dmitrymakelove" target="_blank">made by <span style="color:#ff00ff;">@dmitrymakelove</span><br>(follow on X)</a>';
    
    // Make sure the link doesn't have pointer-events: none
    const link = document.getElementById('creditTextLink');
    if (link) {
      link.style.pointerEvents = 'auto';
      link.style.color = 'inherit';
      link.style.textDecoration = 'none';
    }
  }
}

// Fix effects panel toggle functionality
function fixEffectsToggle() {
  const effectsPanel = document.getElementById('effectsPanel');
  const toggleEffectsButton = document.getElementById('toggleEffectsButton');
  
  // Keep reference to the original keydown handler
  const originalKeyDown = window.onKeyDown;
  
  // Override the E key functionality to properly toggle
  window.onKeyDown = function(event) {
    // Call original handler first
    if (typeof originalKeyDown === 'function') {
      originalKeyDown(event);
    }
    
    // Handle E key for effects panel
    if (event.keyCode === 69) { // 'E' key
      if (effectsPanel) {
        effectsPanel.style.display = effectsPanel.style.display === 'block' ? 'none' : 'block';
        
        // Hide notification once opened
        if (effectsPanel.style.display === 'block') {
          document.documentElement.style.setProperty('--effect-badge-display', 'none');
          localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
        }
      }
    }
  };
  
  // Override button click to properly toggle
  if (toggleEffectsButton && effectsPanel) {
    // Remove existing event listeners
    const newToggleButton = toggleEffectsButton.cloneNode(true);
    toggleEffectsButton.parentNode.replaceChild(newToggleButton, toggleEffectsButton);
    
    // Add new click handler that properly toggles
    newToggleButton.addEventListener('click', function() {
      effectsPanel.style.display = effectsPanel.style.display === 'block' ? 'none' : 'block';
      
      // Hide notification once opened
      if (effectsPanel.style.display === 'block') {
        document.documentElement.style.setProperty('--effect-badge-display', 'none');
        localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
      }
    });
  }
}

// Handle EFX button badge once effects panel has been opened
function setupEffectsPanelBadge() {
  // Check if user has seen effects panel before
  const hasOpenedEffects = localStorage.getItem('neonTrailblazerEffectsOpened') === 'true';
  
  // Set CSS variable to control badge display
  document.documentElement.style.setProperty('--effect-badge-display', hasOpenedEffects ? 'none' : 'block');
}
