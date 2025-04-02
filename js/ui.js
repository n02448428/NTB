/* ------------------ UI MANAGEMENT ------------------ */

function setupUI() {
  // Setup splash screen
  document.getElementById('startButton').addEventListener('click', startGame);
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

  // Make player name available to other scripts
  window.playerName = playerName;

  // Show game over screen
  document.getElementById('gameOver').style.display = 'block';
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

// Direct approach to fix EFX button and E key toggle on all screens
(function() {
  // Wait until DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Fix the effects panel z-index immediately
    const effectsPanel = document.getElementById('effectsPanel');
    if (effectsPanel) {
      // Set a very high z-index to ensure it's above everything
      effectsPanel.style.zIndex = '10001'; // Higher than splash and game over screens
    }
    
    // Clone and replace the toggle button to remove old event listeners
    const toggleEffectsButton = document.getElementById('toggleEffectsButton');
    if (toggleEffectsButton) {
      // Set a very high z-index for the button
      toggleEffectsButton.style.zIndex = '10001';
      
      // Replace with cloned button to remove old listeners
      const newToggleButton = toggleEffectsButton.cloneNode(true);
      toggleEffectsButton.parentNode.replaceChild(newToggleButton, toggleEffectsButton);
      
      // Add new click handler
      newToggleButton.addEventListener('click', function(e) {
        if (effectsPanel) {
          effectsPanel.style.display = effectsPanel.style.display === 'block' ? 'none' : 'block';
          if (effectsPanel.style.display === 'block') {
            document.documentElement.style.setProperty('--effect-badge-display', 'none');
            localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
          }
        }
        e.stopPropagation();
      });
    }
    
    // Make credit text clickable immediately
    const creditText = document.getElementById('creditText');
    if (creditText) {
      creditText.style.zIndex = '10001'; // Very high z-index
      creditText.innerHTML = '<a id="creditTextLink" href="https://twitter.com/dmitrymakelove" target="_blank">made by <span style="color:#ff00ff;">@dmitrymakelove</span><br>(follow on X)</a>';
      
      const link = document.getElementById('creditTextLink');
      if (link) {
        link.style.pointerEvents = 'auto';
        link.style.color = 'inherit';
        link.style.textDecoration = 'none';
      }
    }
    
    // Add a global key listener for E key that works on all screens
    window.addEventListener('keydown', function(e) {
      if (e.key === 'e' || e.key === 'E') {
        if (effectsPanel) {
          effectsPanel.style.display = effectsPanel.style.display === 'block' ? 'none' : 'block';
          if (effectsPanel.style.display === 'block') {
            document.documentElement.style.setProperty('--effect-badge-display', 'none');
            localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
          }
        }
      }
    }, true); // Use capturing phase
    
    // Set badge display based on saved preference
    const hasOpenedEffects = localStorage.getItem('neonTrailblazerEffectsOpened') === 'true';
    document.documentElement.style.setProperty('--effect-badge-display', hasOpenedEffects ? 'none' : 'block');
  });
})();

// Also add these fixes to the window load event to ensure they work after the game is fully loaded
window.addEventListener('load', function() {
  // Ensure effects panel has high z-index
  const effectsPanel = document.getElementById('effectsPanel');
  if (effectsPanel) {
    effectsPanel.style.zIndex = '10001';
  }
  
  // Ensure toggle button has high z-index
  const toggleEffectsButton = document.getElementById('toggleEffectsButton');
  if (toggleEffectsButton) {
    toggleEffectsButton.style.zIndex = '10001';
  }
});

// Enhanced clickable credit text
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    const creditText = document.getElementById('creditText');
    if (creditText) {
      // Make the entire area clickable
      creditText.innerHTML = '<a id="creditTextLink" href="https://twitter.com/dmitrymakelove" target="_blank" style="display:block;text-decoration:none;color:inherit">made by <span style="color:#ff00ff;">@dmitrymakelove</span><br>(follow on X)</a>';
    }
  }, 1000);
});

// Fix for making the credit text fully clickable and EFX notification
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    // Fix for the credit text in bottom left
    const creditText = document.getElementById('creditText');
    if (creditText) {
      // Make the entire container clickable by setting it as a link
      creditText.innerHTML = '';
      creditText.style.cursor = 'pointer';
      creditText.style.pointerEvents = 'auto';
      
      // Create a full-width and height anchor element
      const anchor = document.createElement('a');
      anchor.id = 'creditTextLink';
      anchor.href = 'https://twitter.com/dmitrymakelove';
      anchor.target = '_blank';
      anchor.innerHTML = 'made by <span style="color:#ff00ff;">@dmitrymakelove</span><br>(follow on X)';
      
      // Style the anchor to fill the entire creditText container
      anchor.style.display = 'block';
      anchor.style.width = '100%';
      anchor.style.height = '100%';
      anchor.style.textDecoration = 'none';
      anchor.style.color = 'inherit';
      anchor.style.padding = '5px 10px';
      
      // Add the anchor to the container
      creditText.appendChild(anchor);
      
      // Make sure it has high z-index to be clickable over other elements
      creditText.style.zIndex = '10001';
    }
    
    // Fix for the EFX button notification
    const toggleEffectsButton = document.getElementById('toggleEffectsButton');
    if (toggleEffectsButton) {
      // Check localStorage to see if button was clicked before
      const wasButtonClickedBefore = localStorage.getItem('neonTrailblazerEffectsOpened') === 'true';
      
      if (wasButtonClickedBefore) {
        // User clicked button in a previous session, so hide notification
        document.documentElement.style.setProperty('--effect-badge-display', 'none');
        toggleEffectsButton.classList.add('notification-hidden');
      } else {
        // User hasn't clicked button yet, so show notification
        document.documentElement.style.setProperty('--effect-badge-display', 'block');
        toggleEffectsButton.classList.remove('notification-hidden');
      }
    }
  }, 1000);
});

// Add direct CSS to make sure our styles are applied
const styleElement = document.createElement('style');
styleElement.textContent = `
  /* Make sure the notification is properly displayed/hidden */
  #toggleEffectsButton::after {
    content: "!";
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ff00ff;
    color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    display: var(--effect-badge-display, block);
  }
  
  #toggleEffectsButton.notification-hidden::after {
    display: none !important;
  }
  
  /* Ensure credit text is fully clickable */
  #creditText {
    pointer-events: auto !important;
    cursor: pointer !important;
    z-index: 10001 !important;
  }
  
  #creditTextLink {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
  }
`;
document.head.appendChild(styleElement);
