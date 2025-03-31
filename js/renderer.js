/* ------------------ RENDERER SETUP ------------------ */
// Import statements are handled via importmap in HTML file

// Global renderer variables - DECLARE FIRST
var scene, camera, renderer, composer;
var clock = new THREE.Clock();
var fpsCounter = 0, fpsTime = 0, currentFps = 0;
var effectPasses = {};
var materialsToUpdate = { player: null, grid: null };

// Current effects configuration
var effectsConfig = { ...CONFIG.EFFECTS_CONFIG };

function initRenderer() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011);

  // Create camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('gameContainer').appendChild(renderer.domElement);

  // Setup postprocessing
  setupPostProcessing();
  
  // Basic lighting
  setupLighting();
  
  // Grid floor
  setupGrid();
  
  // Handle window resize
  setupResizeListener();
  
  // Setup the global RENDERER object
  window.RENDERER = {
    scene: scene,
    camera: camera,
    clock: clock,
    initRenderer: initRenderer,
    updateEffects: updateEffects,
    updateMaterialColors: updateMaterialColors,
    updateCameraForOrientation: updateCameraForOrientation,
    render: render,
    effectsConfig: effectsConfig,
    materialsToUpdate: materialsToUpdate
  };
  
  optimizeForMobile();
}

function setupPostProcessing() {
  composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom pass
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8 * effectsConfig.bloom,
    0.3 + (effectsConfig.bloom * 0.2),
    0.85 - (effectsConfig.bloom * 0.05)
  );
  composer.addPass(bloomPass);
  effectPasses.bloom = bloomPass;

  // Pixelation pass
  const pixelPass = new THREE.ShaderPass(PixelShader);
  pixelPass.uniforms.pixelSize.value = effectsConfig.pixel;
  composer.addPass(pixelPass);
  effectPasses.pixel = pixelPass;

  // Color adjustment pass
  const colorPass = new THREE.ShaderPass(ColorShader);
  colorPass.uniforms.hueShift.value = effectsConfig.hueShift;
  colorPass.uniforms.saturation.value = effectsConfig.saturation;
  colorPass.uniforms.colorPulse.value = effectsConfig.colorPulse;
  colorPass.uniforms.speed.value = effectsConfig.speed;
  composer.addPass(colorPass);
  effectPasses.color = colorPass;

  // Scanline pass
  const scanlinePass = new THREE.ShaderPass(ScanlineShader);
  scanlinePass.uniforms.intensity.value = effectsConfig.scanline;
  scanlinePass.uniforms.speed.value = effectsConfig.speed;
  composer.addPass(scanlinePass);
  effectPasses.scanline = scanlinePass;

  // Glitch pass
  const glitchPass = new THREE.GlitchPass();
  glitchPass.enabled = effectsConfig.glitch > 0;
  glitchPass.goWild = effectsConfig.wildGlitch;
  composer.addPass(glitchPass);
  effectPasses.glitch = glitchPass;
}

function optimizeForMobile() {
  if (CONFIG.IS_MOBILE) {
    // Reduce effects intensity on mobile
    effectsConfig.bloom *= 0.7;
    effectsConfig.pixel = Math.max(1, effectsConfig.pixel);
    
    // Disable most intensive effects
    if (effectPasses.glitch) effectPasses.glitch.enabled = false;
    
    // Update UI to reflect changes
    updateSliders();
    
    // Add a mobile performance mode toggle
    addPerformanceModeToggle();
  }
}

function addPerformanceModeToggle() {
  const panel = document.getElementById('effectsPanel');
  if (!panel) return;
  
  const toggleContainer = document.createElement('div');
  toggleContainer.innerHTML = `
    <div class="effect-control" style="margin-top:15px; border-top:1px solid rgba(0,255,255,0.3); padding-top:10px;">
      <input type="checkbox" id="performanceMode" checked>
      <label for="performanceMode">Mobile Performance Mode</label>
    </div>
  `;
  
  panel.appendChild(toggleContainer);
  
  document.getElementById('performanceMode').addEventListener('change', function(e) {
    if (this.checked) {
      // Enable performance optimizations
      if (effectPasses.bloom) effectPasses.bloom.strength *= 0.7;
      if (effectPasses.glitch) effectPasses.glitch.enabled = false;
    } else {
      // Disable performance optimizations
      if (effectPasses.bloom) effectPasses.bloom.strength /= 0.7;
      if (effectPasses.glitch) effectPasses.glitch.enabled = effectsConfig.glitch > 0;
    }
  });
}

function setupLighting() {
  scene.add(new THREE.AmbientLight(0x444444));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 100, 0);
  scene.add(directionalLight);
}

function setupGrid() {
  const gridColor = new THREE.Color(effectsConfig.gridColor);
  const gridHelper = new THREE.GridHelper(CONFIG.WORLD_SIZE, 50, gridColor, 0x004488);
  scene.add(gridHelper);
  materialsToUpdate.grid = gridHelper;
}

function setupResizeListener() {
  window.addEventListener('resize', () => {
    setTimeout(() => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        updateCameraForOrientation();
      }
    }, 100);
  });
}

function updateCameraForOrientation() {
  if (!camera || !PLAYER || !PLAYER.bike) return;

  const isPortrait = window.innerHeight > window.innerWidth;

  if (isPortrait) {
    camera.position.set(PLAYER.bike.position.x, 40, PLAYER.bike.position.z + 80);
  } else {
    camera.position.set(PLAYER.bike.position.x, 20, PLAYER.bike.position.z + 50);
  }

  camera.lookAt(PLAYER.bike.position);
}

function updateEffects() {
  if (effectPasses.bloom) {
    const bloomStrength = Math.pow(effectsConfig.bloom, 1.5) * 0.4 * (1 + effectsConfig.master * 0.2);
    const bloomRadius = 0.3 + (effectsConfig.bloom * effectsConfig.master * 0.1);
    const bloomThreshold = Math.max(0.1, 0.9 - (effectsConfig.bloom * effectsConfig.master * 0.03));

    effectPasses.bloom.strength = bloomStrength;
    effectPasses.bloom.radius = bloomRadius;
    effectPasses.bloom.threshold = bloomThreshold;
  }

  if (effectPasses.pixel && effectPasses.pixel.uniforms) {
    effectPasses.pixel.uniforms.pixelSize.value = Math.pow(effectsConfig.pixel, 1.5);
  }

  if (effectPasses.color && effectPasses.color.uniforms) {
    effectPasses.color.uniforms.hueShift.value = effectsConfig.hueShift;
    effectPasses.color.uniforms.saturation.value = effectsConfig.saturation;
    effectPasses.color.uniforms.colorPulse.value = effectsConfig.colorPulse * effectsConfig.master;
    effectPasses.color.uniforms.speed.value = effectsConfig.speed;
  }

  if (effectPasses.scanline && effectPasses.scanline.uniforms) {
    effectPasses.scanline.uniforms.intensity.value = effectsConfig.scanline * effectsConfig.master;
    effectPasses.scanline.uniforms.speed.value = effectsConfig.speed;
  }

  if (effectPasses.glitch) {
    effectPasses.glitch.enabled = effectsConfig.glitch > 0;
    effectPasses.glitch.goWild = effectsConfig.wildGlitch;

    if (effectPasses.glitch.uniforms) {
      Math.seedrandom(effectsConfig.glitchSeed.toString());

      if (effectPasses.glitch.uniforms.amount) {
        effectPasses.glitch.uniforms.amount.value = Math.min(1.0, effectsConfig.glitch * 0.1);
      }

      if (effectPasses.glitch.uniforms.seed_x) {
        effectPasses.glitch.uniforms.seed_x.value = Math.random();
      }

      if (effectPasses.glitch.uniforms.seed_y) {
        effectPasses.glitch.uniforms.seed_y.value = Math.random();
      }

      if (effectPasses.glitch.uniforms.distortion_x) {
        effectPasses.glitch.uniforms.distortion_x.value = Math.random() * 2;
      }

      if (effectPasses.glitch.uniforms.distortion_y) {
        effectPasses.glitch.uniforms.distortion_y.value = Math.random() * 2;
      }

      Math.seedrandom();
    }
  }
}

function updateMaterialColors() {
  if (materialsToUpdate.player) {
    const playerColor = new THREE.Color(effectsConfig.playerColor);
    materialsToUpdate.player.color.set(playerColor);
    materialsToUpdate.player.emissive.set(playerColor);
  }

  if (materialsToUpdate.grid) {
    const gridColor = new THREE.Color(effectsConfig.gridColor);
    if (Array.isArray(materialsToUpdate.grid.material)) {
      materialsToUpdate.grid.material[0].color.set(gridColor);
    }
  }
}

function render() {
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // FPS calculation
  fpsCounter++;
  if (elapsedTime - fpsTime >= 1.0) {
    currentFps = Math.round(fpsCounter / (elapsedTime - fpsTime));
    document.getElementById('fpsCounter').textContent = currentFps;
    fpsCounter = 0;
    fpsTime = elapsedTime;
  }

  // Always update time-based effects 
  if (effectPasses.color && effectPasses.color.uniforms) {
    effectPasses.color.uniforms.time.value = elapsedTime;
  }

  if (effectPasses.scanline && effectPasses.scanline.uniforms) {
    effectPasses.scanline.uniforms.time.value = elapsedTime;
  }

  if (window.PORTAL && PORTAL.updatePortals) {
    PORTAL.updatePortals(delta, elapsedTime);
  }
  
  composer.render();
}

// Initialize the renderer immediately
initRenderer();
