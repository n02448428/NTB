/* ------------------ MUSIC SYSTEM ------------------ */

// Music state
let isMusicPlaying = true; // Set default to true for autoplay

function setupMusicControls() {
  const music = document.getElementById('backgroundMusic');
  const musicButton = document.getElementById('toggleMusicButton');

  // Set initial volume
  music.volume = CONFIG.MUSIC_VOLUME;

  // Update button text to match default state
  musicButton.textContent = 'MUSIC: ON';

  // Attempt to autoplay music (will likely be blocked by browser)
  attemptAutoplay();

  // Setup click listeners for all interactive elements to try to start music
  document.addEventListener('click', function () {
    if (isMusicPlaying && music.paused) {
      attemptAutoplay();
    }
  }, { once: true });

  // Use user interaction with game controls to enable music
  document.addEventListener('keydown', function () {
    if (isMusicPlaying && music.paused) {
      attemptAutoplay();
    }
  }, { once: true });

  // Toggle music when button is clicked
  musicButton.addEventListener('click', function () {
    if (isMusicPlaying) {
      music.pause();
      musicButton.textContent = 'MUSIC: OFF';
      isMusicPlaying = false;
    } else {
      music.play().catch(e => {
        console.error('Error playing music:', e);
      });
      musicButton.textContent = 'MUSIC: ON';
      isMusicPlaying = true;
    }
  });

  // Also add music toggle to pause screen
  const resumeButton = document.getElementById('resumeButton');
  const pauseOverlay = document.getElementById('pauseOverlay');

  // Create music toggle button for pause screen if it doesn't exist
  if (!document.getElementById('pauseMusicButton')) {
    const pauseMusicButton = document.createElement('button');
    pauseMusicButton.id = 'pauseMusicButton';
    pauseMusicButton.textContent = 'MUSIC: ON'; // Match default state
    pauseMusicButton.style.marginTop = '10px';

    pauseMusicButton.addEventListener('click', function () {
      if (isMusicPlaying) {
        music.pause();
        musicButton.textContent = 'MUSIC: OFF';
        pauseMusicButton.textContent = 'MUSIC: OFF';
        isMusicPlaying = false;
      } else {
        music.play().catch(e => {
          console.error('Error playing music:', e);
        });
        musicButton.textContent = 'MUSIC: ON';
        pauseMusicButton.textContent = 'MUSIC: ON';
        isMusicPlaying = true;
      }
    });

    // Insert before the resume button
    pauseOverlay.insertBefore(pauseMusicButton, resumeButton);
  }
}

function attemptAutoplay() {
  const music = document.getElementById('backgroundMusic');

  // Try to play the music
  music.play().catch(e => {
    console.log('Autoplay prevented by browser, waiting for user interaction');
    // We'll try again on first user interaction, already set up the listeners above
  });
}

// Handle automatic music stop/play when tab visibility changes
document.addEventListener('visibilitychange', function () {
  const music = document.getElementById('backgroundMusic');

  if (document.hidden) {
    // Tab is hidden, store current music state and pause
    if (!music.paused) {
      music.pause();
      music.dataset.wasPlaying = 'true';
    }
  } else {
    // Tab is visible again, resume if it was playing
    if (music.dataset.wasPlaying === 'true' && isMusicPlaying) {
      music.play().catch(e => {
        console.error('Error resuming music:', e);
      });
      delete music.dataset.wasPlaying;
    }
  }
});

// Start music when game starts
function startGameWithMusic() {
  const music = document.getElementById('backgroundMusic');
  if (isMusicPlaying) {
    music.play().catch(e => {
      console.log('Music autoplay prevented when starting game');
    });
  }
}