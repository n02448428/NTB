/* ------------------ GAME CONSTANTS & VARIABLES ------------------ */
const CONFIG = {
    // Game world
    WORLD_SIZE: 1000,
    
    // Movement
    PLAYER_SPEED: 1.2,
    AI_SPEED_BASE: 1.3,
    
    // Spawn locations
    SPAWN_POINT_X: 0,
    SPAWN_POINT_Y: 3,
    SPAWN_POINT_Z: -1000 / 4, // -WORLD_SIZE / 4
    
    // Mobile detection
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    
    // Visual effect defaults
    EFFECTS_CONFIG: {
      master: 1.0,
      bloom: 1.0,
      pixel: 1,
      glitch: 0.0,
      glitchSeed: 1,
      scanline: 0.0,
      speed: 1.0,
      wildGlitch: false,
      hueShift: 0,
      saturation: 1.0,
      colorPulse: 1.0,
      playerColor: "#ff00ff",
      gridColor: "#0088ff"
    },
    
    // AI Knowledge base defaults
    KNOWLEDGE_BASE: {
      avoidDistance: 25,
      powerupWeight: 50,
      turnRandomness: 0.2,
      avoidWallWeight: 1.0,
      learningRate: 0.1
    },
    
    // Audio
    MUSIC_VOLUME: 0.3,
    
    // Visual presets
    VISUAL_PRESETS: {
      "default": {
        master: 1.0, bloom: 1.0, pixel: 1, glitch: 0.0, glitchSeed: 1,
        scanline: 0.0, speed: 1.0, wildGlitch: false, hueShift: 0,
        saturation: 1.0, colorPulse: 1.0, playerColor: "#ff00ff", gridColor: "#0088ff"
      },
      "retro": {
        master: 1.2, bloom: 1.0, pixel: 6, glitch: 0.5, glitchSeed: 42,
        scanline: 3.0, speed: 0.8, wildGlitch: false, hueShift: 250,
        saturation: 0.9, colorPulse: 1.0, playerColor: "#00ffff", gridColor: "#0055ff"
      },
      "cyberpunk": {
        master: 1.5, bloom: 2.5, pixel: 2, glitch: 2.0, glitchSeed: 137,
        scanline: 1.0, speed: 1.2, wildGlitch: false, hueShift: 320,
        saturation: 1.2, colorPulse: 2.0, playerColor: "#ff2288", gridColor: "#00ddff"
      },
      "lofi": {
        master: 0.8, bloom: 0.5, pixel: 8, glitch: 0.3, glitchSeed: 256,
        scanline: 2.0, speed: 0.8, wildGlitch: false, hueShift: 190,
        saturation: 0.8, colorPulse: 0.5, playerColor: "#55aaff", gridColor: "#559988"
      },
      "vaporwave": {
        master: 1.3, bloom: 1.8, pixel: 3, glitch: 1.0, glitchSeed: 420,
        scanline: 1.5, speed: 0.7, wildGlitch: false, hueShift: 280,
        saturation: 1.4, colorPulse: 1.5, playerColor: "#ff44ff", gridColor: "#55ddff"
      },
      "glitchy": {
        master: 1.5, bloom: 1.5, pixel: 4, glitch: 3.5, glitchSeed: 666,
        scanline: 0.8, speed: 1.5, wildGlitch: true, hueShift: 0,
        saturation: 1.1, colorPulse: 2.0, playerColor: "#ff3300", gridColor: "#00ff88"
      },
      "minimal": {
        master: 0.7, bloom: 0.8, pixel: 1, glitch: 0.0, glitchSeed: 1,
        scanline: 0.0, speed: 1.0, wildGlitch: false, hueShift: 180,
        saturation: 0.9, colorPulse: 0.0, playerColor: "#ffffff", gridColor: "#4444ff"
      }
    },
    
    // Game state
    STATE: {
      isGameOver: false,
      isPaused: false,
      gameStarted: false,
      updatingUI: false
    }
  };