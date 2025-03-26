/* ------------------ SPLASH SCREEN DEMO MODE ------------------ */

// Unique variables for splash screen preview
let splashDemoActive = false;
let splashScene, splashCamera, splashRenderer, splashComposer;
let splashClock = new THREE.Clock();
let splashPlayerBike, splashPlayerDirection;
let splashAIBikes = [];
let splashObstacles = [];
let splashPowerups = [];
let splashCameraViews = [];
let splashCameraIndex = 0;
let splashLastCameraChange = 0;
let splashAnimationFrame = null;

// Initialize once DOM is loaded
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(initSplashDemo, 500);
});

// Initialize splash demo
function initSplashDemo() {
  console.log("Initializing splash demo");
  
  // Create canvas for splash demo
  const splashCanvas = document.createElement('canvas');
  splashCanvas.id = 'splashDemoCanvas';
  splashCanvas.style.position = 'fixed';
  splashCanvas.style.top = '0';
  splashCanvas.style.left = '0';
  splashCanvas.style.width = '100%';
  splashCanvas.style.height = '100%';
  splashCanvas.style.zIndex = '998';
  
  // Get splash screen and insert canvas before it
  const splashScreen = document.getElementById('splashScreen');
  if (splashScreen) {
    document.body.insertBefore(splashCanvas, splashScreen);
    
    // Make splash screen semi-transparent
    splashScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    splashScreen.style.backdropFilter = 'blur(3px)';
    
    // Add style for splash screen elements
    const style = document.createElement('style');
    style.textContent = `
      #splashTitle {
        text-shadow: 0 0 20px #0ff, 0 0 40px #0ff !important;
      }
      
      #startButton, #leaderboardButton, #toggleMusicButton {
        background: rgba(0, 0, 0, 0.5) !important;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.7) !important;
      }
      
      #startButton:hover, #leaderboardButton:hover, #toggleMusicButton:hover {
        background: rgba(0, 255, 255, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add click handler for changing camera views
    document.body.addEventListener('click', function(e) {
      if (splashDemoActive && splashScreen.style.display !== 'none') {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const clickedOnUI = elements.some(el => 
          el.tagName === 'BUTTON' || 
          el.id === 'playerNameInput' || 
          el.tagName === 'INPUT');
        
        if (!clickedOnUI) {
          changeSplashCamera();
        }
      }
    });
    
    // Set up hide demo on game start
    document.getElementById('startButton').addEventListener('click', hideSplashDemo);
  }
  
  // Set up Three.js environment
  setupSplashRenderer(splashCanvas);
  
  // Create scene
  splashScene = new THREE.Scene();
  splashScene.background = new THREE.Color(0x000011);
  
  // Create camera
  splashCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  splashCamera.position.set(0, 100, 200);
  splashCamera.lookAt(0, 0, 0);
  
  // Add lighting
  setupSplashLighting();
  
  // Add grid
  const gridColor = new THREE.Color(effectsConfig.gridColor);
  const gridHelper = new THREE.GridHelper(WORLD_SIZE, 50, gridColor, 0x004488);
  splashScene.add(gridHelper);
  
  // Create world boundaries
  createSplashBoundaries();
  
  // Create camera views
  setupSplashCameraViews();
  
  // Populate the scene
  populateSplashScene();
  
  // Start animation
  splashDemoActive = true;
  splashClock.start();
  animateSplashDemo();
  
  console.log("Splash demo initialized");
}

// Set up renderer
function setupSplashRenderer(canvas) {
  splashRenderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  splashRenderer.setSize(window.innerWidth, window.innerHeight);
  
  // Set up post-processing if available
  if (window.EffectComposer) {
    splashComposer = new EffectComposer(splashRenderer);
    const renderPass = new RenderPass(splashScene, splashCamera);
    splashComposer.addPass(renderPass);
    
    // Add bloom effect if available
    if (window.UnrealBloomPass) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8 * effectsConfig.bloom,
        0.3 + (effectsConfig.bloom * 0.2),
        0.85 - (effectsConfig.bloom * 0.05)
      );
      splashComposer.addPass(bloomPass);
    }
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (splashDemoActive) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      splashCamera.aspect = width / height;
      splashCamera.updateProjectionMatrix();
      
      splashRenderer.setSize(width, height);
      
      if (splashComposer) {
        splashComposer.setSize(width, height);
      }
    }
  });
}

// Add lighting to the scene
function setupSplashLighting() {
  splashScene.add(new THREE.AmbientLight(0x444444));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 100, 0);
  splashScene.add(directionalLight);
}

// Create world boundaries
function createSplashBoundaries() {
  const wallHeight = 20;
  const wallMaterial = new THREE.MeshPhongMaterial({
    color: 0x0088ff,
    emissive: 0x0044aa,
    transparent: true,
    opacity: 0.3
  });

  const walls = [
    { size: [WORLD_SIZE, wallHeight, 2], pos: [0, wallHeight/2, -WORLD_SIZE/2] }, // North
    { size: [WORLD_SIZE, wallHeight, 2], pos: [0, wallHeight/2, WORLD_SIZE/2] },  // South
    { size: [2, wallHeight, WORLD_SIZE], pos: [WORLD_SIZE/2, wallHeight/2, 0] },  // East
    { size: [2, wallHeight, WORLD_SIZE], pos: [-WORLD_SIZE/2, wallHeight/2, 0] }  // West
  ];
  
  walls.forEach(wall => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...wall.size), 
      wallMaterial
    );
    mesh.position.set(...wall.pos);
    splashScene.add(mesh);
    splashObstacles.push(mesh);
  });
}

// Set up camera views
function setupSplashCameraViews() {
  // Overview from above
  splashCameraViews.push({
    name: "overview",
    getPosition: function() {
      return new THREE.Vector3(0, 250, 0);
    },
    getTarget: function() {
      return new THREE.Vector3(0, 0, 0);
    }
  });
  
  // Corner view
  splashCameraViews.push({
    name: "corner",
    getPosition: function() {
      return new THREE.Vector3(300, 180, 300);
    },
    getTarget: function() {
      return new THREE.Vector3(0, 0, 0);
    }
  });
  
  // Player following view (added after player creation)
}

// Populate the scene with objects
function populateSplashScene() {
  // Create player
  createSplashPlayer();
  
  // Add player-specific camera views now that player exists
  addPlayerCameraViews();
  
  // Create obstacles
  for (let i = 0; i < 80; i++) {
    createSplashObstacle();
  }
  
  // Create powerups
  for (let i = 0; i < 40; i++) {
    createSplashPowerup();
  }
  
  // Create AI bikes
  for (let i = 0; i < 10; i++) {
    createSplashAIBike(i);
  }
}

// Create player bike
function createSplashPlayer() {
  // Create group
  splashPlayerBike = new THREE.Group();
  const playerColor = new THREE.Color(effectsConfig.playerColor);
  
  // Set direction
  splashPlayerDirection = new THREE.Vector3(1, 0, 0);
  
  // Create materials
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: playerColor,
    emissive: playerColor,
    emissiveIntensity: 0.8 + (effectsConfig.master * 0.3),
    shininess: 30
  });
  
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: playerColor,
    emissive: playerColor,
    emissiveIntensity: 1.5 + (effectsConfig.master * 0.5),
    transparent: true,
    opacity: 0.9
  });
  
  // Main body parts
  const parts = [
    { geo: new THREE.BoxGeometry(4, 6, 0.5), pos: [0, 0, 0], mat: bodyMaterial },
    { geo: new THREE.BoxGeometry(1, 6, 0.75), pos: [2.5, 0, 0], mat: bodyMaterial }
  ];
  
  // Edge parts
  const edgeParts = [
    { geo: new THREE.BoxGeometry(4.5, 0.2, 0.6), pos: [0, 3, 0], mat: edgeMaterial },
    { geo: new THREE.BoxGeometry(4.5, 0.2, 0.6), pos: [0, -3, 0], mat: edgeMaterial },
    { geo: new THREE.BoxGeometry(0.2, 6, 0.6), pos: [2.9, 0, 0], mat: edgeMaterial },
    { geo: new THREE.BoxGeometry(0.2, 6, 0.6), pos: [-2, 0, 0], mat: edgeMaterial }
  ];
  
  // Add main parts
  parts.forEach(part => {
    const mesh = new THREE.Mesh(part.geo, part.mat);
    mesh.position.set(...part.pos);
    splashPlayerBike.add(mesh);
  });
  
  // Add edge parts
  edgeParts.forEach(part => {
    const mesh = new THREE.Mesh(part.geo, part.mat);
    mesh.position.set(...part.pos);
    splashPlayerBike.add(mesh);
  });
  
  // Add lights
  const centerLight = new THREE.PointLight(
    playerColor, 
    1 + (effectsConfig.master * 0.5), 
    8 + (effectsConfig.master * 3)
  );
  centerLight.position.set(0, 0, 0);
  splashPlayerBike.add(centerLight);
  
  const frontLight = new THREE.PointLight(
    playerColor, 
    0.7 + (effectsConfig.master * 0.3), 
    5 + (effectsConfig.master * 2)
  );
  frontLight.position.set(2.5, 0, 0);
  splashPlayerBike.add(frontLight);
  
  // Position and add to scene
  splashPlayerBike.position.set(-WORLD_SIZE/4, 3, 0);
  splashPlayerBike.rotation.y = -Math.atan2(splashPlayerDirection.z, splashPlayerDirection.x);
  splashPlayerBike.userData = {
    direction: splashPlayerDirection.clone(),
    speed: PLAYER_SPEED,
    color: playerColor,
    trail: []
  };
  
  splashScene.add(splashPlayerBike);
  
  // Create long trail
  createSplashTrail(splashPlayerBike, 40);
}

// Add player-specific camera views
function addPlayerCameraViews() {
  // Player following view
  splashCameraViews.push({
    name: "player-follow",
    getPosition: function() {
      const dir = splashPlayerBike.userData.direction.clone();
      return new THREE.Vector3(
        splashPlayerBike.position.x - dir.x * 50,
        20,
        splashPlayerBike.position.z - dir.z * 50
      );
    },
    getTarget: function() {
      return splashPlayerBike.position.clone();
    }
  });
  
  // Side view of player
  splashCameraViews.push({
    name: "player-side",
    getPosition: function() {
      const dir = splashPlayerBike.userData.direction.clone();
      const sideDir = new THREE.Vector3(-dir.z, 0, dir.x);
      return new THREE.Vector3(
        splashPlayerBike.position.x + sideDir.x * 40,
        15,
        splashPlayerBike.position.z + sideDir.z * 40
      );
    },
    getTarget: function() {
      return splashPlayerBike.position.clone();
    }
  });
}

// Create trail for a bike
function createSplashTrail(bike, length) {
  const direction = bike.userData.direction.clone().multiplyScalar(-1);
  const bikeColor = bike.userData.color;
  
  let position = bike.position.clone();
  let currentDirection = direction.clone();
  
  for (let i = 0; i < length; i++) {
    const geometry = new THREE.BoxGeometry(2, 6, 0.5);
    const material = new THREE.MeshPhongMaterial({
      color: bikeColor,
      emissive: bikeColor,
      emissiveIntensity: 0.7 + (effectsConfig.master * 0.3),
      transparent: false
    });
    
    const segment = new THREE.Mesh(geometry, material);
    position.add(currentDirection.clone().multiplyScalar(3));
    segment.position.copy(position);
    segment.rotation.y = -Math.atan2(currentDirection.z, currentDirection.x);
    
    splashScene.add(segment);
    bike.userData.trail.push(segment);
    
    // Random turns for long trails (except player's first 10 segments)
    if ((bike !== splashPlayerBike || i > 10) && 
        i > 0 && i % 8 === 0 && Math.random() > 0.6) {
      if (Math.random() > 0.5) {
        // Turn left
        currentDirection.set(currentDirection.z, 0, -currentDirection.x);
      } else {
        // Turn right
        currentDirection.set(-currentDirection.z, 0, currentDirection.x);
      }
    }
  }
}

// Create AI bike
function createSplashAIBike(index) {
  const hue = (index * 60) % 360;
  const aiColor = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
  
  const aiBike = new THREE.Group();
  
  // Body material
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: aiColor,
    emissive: aiColor,
    emissiveIntensity: 0.8 + (effectsConfig.master * 0.3),
    shininess: 30
  });
  
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: aiColor,
    emissive: aiColor,
    emissiveIntensity: 1.5 + (effectsConfig.master * 0.5),
    transparent: true,
    opacity: 0.9
  });
  
  // Main body parts
  const parts = [
    { geo: new THREE.BoxGeometry(4, 6, 0.5), pos: [0, 0, 0], mat: bodyMaterial },
    { geo: new THREE.BoxGeometry(1, 6, 0.75), pos: [2.5, 0, 0], mat: bodyMaterial }
  ];
  
  // Edge parts
  const edgeParts = [
    { geo: new THREE.BoxGeometry(4.5, 0.2, 0.6), pos: [0, 3, 0], mat: edgeMaterial },
    { geo: new THREE.BoxGeometry(4.5, 0.2, 0.6), pos: [0, -3, 0], mat: edgeMaterial },
    { geo: new THREE.BoxGeometry(0.2, 6, 0.6), pos: [2.9, 0, 0], mat: edgeMaterial },
    { geo: new THREE.BoxGeometry(0.2, 6, 0.6), pos: [-2, 0, 0], mat: edgeMaterial }
  ];
  
  // Add main parts
  parts.forEach(part => {
    const mesh = new THREE.Mesh(part.geo, part.mat);
    mesh.position.set(...part.pos);
    aiBike.add(mesh);
  });
  
  // Add edge parts
  edgeParts.forEach(part => {
    const mesh = new THREE.Mesh(part.geo, part.mat);
    mesh.position.set(...part.pos);
    aiBike.add(mesh);
  });
  
  // Add lights
  const centerLight = new THREE.PointLight(
    aiColor, 
    1 + (effectsConfig.master * 0.5), 
    8 + (effectsConfig.master * 3)
  );
  centerLight.position.set(0, 0, 0);
  aiBike.add(centerLight);
  
  const frontLight = new THREE.PointLight(
    aiColor, 
    0.7 + (effectsConfig.master * 0.3), 
    5 + (effectsConfig.master * 2)
  );
  frontLight.position.set(2.5, 0, 0);
  aiBike.add(frontLight);
  
  // Choose position in grid-aligned pattern
  // Pick one of four directions based on position
  const directions = [
    new THREE.Vector3(1, 0, 0),   // right
    new THREE.Vector3(0, 0, 1),   // down
    new THREE.Vector3(-1, 0, 0),  // left
    new THREE.Vector3(0, 0, -1)   // up
  ];
  
  // Place in one of four quadrants
  const quadrant = index % 4;
  let x, z, direction;
  
  switch(quadrant) {
    case 0: // top-right
      x = 200 + Math.round(Math.random() * 10) * 20;
      z = -(200 + Math.round(Math.random() * 10) * 20);
      direction = directions[2]; // facing left
      break;
    case 1: // bottom-right
      x = 200 + Math.round(Math.random() * 10) * 20;
      z = 200 + Math.round(Math.random() * 10) * 20;
      direction = directions[3]; // facing up
      break;
    case 2: // bottom-left
      x = -(200 + Math.round(Math.random() * 10) * 20);
      z = 200 + Math.round(Math.random() * 10) * 20;
      direction = directions[0]; // facing right
      break;
    case 3: // top-left
      x = -(200 + Math.round(Math.random() * 10) * 20);
      z = -(200 + Math.round(Math.random() * 10) * 20);
      direction = directions[1]; // facing down
      break;
  }
  
  // Check for obstacles at this position
  let validPosition = !isPositionBlocked(x, z, 10);
  
  // If position is blocked, try a few alternatives
  if (!validPosition) {
    for (let i = 0; i < 10; i++) {
      const newX = x + (Math.random() - 0.5) * 100;
      const newZ = z + (Math.random() - 0.5) * 100;
      
      if (!isPositionBlocked(newX, newZ, 10)) {
        x = newX;
        z = newZ;
        validPosition = true;
        break;
      }
    }
  }
  
  aiBike.position.set(x, 3, z);
  aiBike.rotation.y = -Math.atan2(direction.z, direction.x);
  
  // Store direction and other data
  aiBike.userData = {
    direction: direction,
    speed: AI_SPEED_BASE * (1 + Math.random() * 0.2),
    color: aiColor,
    trail: []
  };
  
  splashScene.add(aiBike);
  splashAIBikes.push(aiBike);
  
  // Create trail
  createSplashTrail(aiBike, 15 + Math.floor(Math.random() * 25));
  
  // Add AI bike camera view (but only for a couple of bikes)
  if (index < 3) {
    splashCameraViews.push({
      name: "ai-follow-" + index,
      getPosition: function() {
        const dir = aiBike.userData.direction.clone();
        return new THREE.Vector3(
          aiBike.position.x - dir.x * 40,
          20,
          aiBike.position.z - dir.z * 40
        );
      },
      getTarget: function() {
        return aiBike.position.clone();
      }
    });
  }
}

// Create obstacle
function createSplashObstacle() {
  // Base obstacle types
  const types = [
    { geoType: "box", color: 0xff5500 },
    { geoType: "cylinder", color: 0x00ff88 },
    { geoType: "tetrahedron", color: 0xffff00 }
  ];
  
  // Select a random type
  const type = types[Math.floor(Math.random() * types.length)];
  
  // Generate a random size multiplier
  const sizeMultiplier = Math.random() * 5;
  
  // Create geometry based on type and size
  let geometry;
  switch(type.geoType) {
    case "box":
      geometry = new THREE.BoxGeometry(
        10 * sizeMultiplier, 
        15 * sizeMultiplier, 
        10 * sizeMultiplier
      );
      break;
    case "cylinder":
      const radius = 5 * sizeMultiplier;
      geometry = new THREE.CylinderGeometry(
        radius, 
        radius, 
        20 * sizeMultiplier, 
        8
      );
      break;
    case "tetrahedron":
      geometry = new THREE.TetrahedronGeometry(10 * sizeMultiplier);
      break;
  }
  
  // Create material and mesh
  const material = new THREE.MeshPhongMaterial({
    color: type.color,
    emissive: type.color,
    emissiveIntensity: 0.3 + (effectsConfig.master * 0.2)
  });
  
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.userData = { sizeMultiplier: sizeMultiplier };
  
  // Find valid position
  let validPosition = false;
  let attempts = 0;
  let x, z, y;
  
  while (!validPosition && attempts < 30) {
    attempts++;
    
    // Use grid-aligned positions
    x = Math.round(Math.random() * 40 - 20) * 20;
    z = Math.round(Math.random() * 40 - 20) * 20;
    
    // Don't place obstacles right at origin
    if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;
    
    // Don't place obstacles too close to player
    if (splashPlayerBike && 
        Math.hypot(x - splashPlayerBike.position.x, z - splashPlayerBike.position.z) < 80) {
      continue;
    }
    
    // Check distance to other obstacles
    validPosition = !isPositionBlocked(x, z, 20 * sizeMultiplier);
  }
  
  // If we couldn't find a valid position, try a random one
  if (!validPosition) {
    x = (Math.random() - 0.5) * (WORLD_SIZE - 100);
    z = (Math.random() - 0.5) * (WORLD_SIZE - 100);
  }
  
  // Set Y position based on geometry type
  if (type.geoType === "box") {
    y = (15 * sizeMultiplier) / 2;
  } else if (type.geoType === "tetrahedron") {
    y = (10 * sizeMultiplier) / 2;
  } else { // cylinder
    y = (20 * sizeMultiplier) / 2;
  }
  
  obstacle.position.set(x, y, z);
  splashScene.add(obstacle);
  splashObstacles.push(obstacle);
}

// Create powerup
function createSplashPowerup() {
  const geometry = new THREE.SphereGeometry(3, 16, 16);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.8 + (effectsConfig.master * 0.4)
  });
  
  const powerup = new THREE.Mesh(geometry, material);
  
  // Find valid position using grid alignment
  let validPosition = false;
  let attempts = 0;
  let x, z;
  
  while (!validPosition && attempts < 30) {
    attempts++;
    
    // Use grid-aligned positions
    x = Math.round(Math.random() * 40 - 20) * 20;
    z = Math.round(Math.random() * 40 - 20) * 20;
    
    // Check if position is blocked
    validPosition = !isPositionBlocked(x, z, 10);
  }
  
  // If we couldn't find a valid position, try a random one
  if (!validPosition) {
    x = (Math.random() - 0.5) * (WORLD_SIZE - 100);
    z = (Math.random() - 0.5) * (WORLD_SIZE - 100);
  }
  
  powerup.position.set(x, 3, z);
  
  // Add pulsing light
  const powerupLight = new THREE.PointLight(
    0xffffff, 
    0.7 * (1 + effectsConfig.master), 
    15 * (1 + effectsConfig.master)
  );
  powerupLight.position.copy(powerup.position);
  splashScene.add(powerupLight);
  
  powerup.userData = { 
    light: powerupLight,
    initialY: powerup.position.y
  };
  
  splashScene.add(powerup);
  splashPowerups.push(powerup);
}

// Check if a position is blocked by obstacles or bikes
function isPositionBlocked(x, z, minDistance) {
  // Check obstacles
  for (let obstacle of splashObstacles) {
    const sizeMultiplier = obstacle.userData.sizeMultiplier || 1;
    const distance = minDistance * sizeMultiplier;
    
    if (Math.hypot(x - obstacle.position.x, z - obstacle.position.z) < distance) {
      return true;
    }
  }
  
  // Check player bike
  if (splashPlayerBike && 
      Math.hypot(x - splashPlayerBike.position.x, z - splashPlayerBike.position.z) < minDistance * 2) {
    return true;
  }
  
  // Check AI bikes
  for (let bike of splashAIBikes) {
    if (Math.hypot(x - bike.position.x, z - bike.position.z) < minDistance * 2) {
      return true;
    }
  }
  
  return false;
}

// Change camera view
function changeSplashCamera() {
  splashCameraIndex = (splashCameraIndex + 1) % splashCameraViews.length;
  splashLastCameraChange = Date.now();
  console.log("Camera changed to: " + splashCameraViews[splashCameraIndex].name);
}

// Hide splash demo
function hideSplashDemo() {
  // Cancel animation frame if active
  if (splashAnimationFrame) {
    cancelAnimationFrame(splashAnimationFrame);
    splashAnimationFrame = null;
  }

  splashDemoActive = false;
  
  // Clear resources
  const canvas = document.getElementById('splashDemoCanvas');
  if (canvas) {
    canvas.style.display = 'none';
  }
  
  // Clean up Three.js objects to prevent memory leaks
  if (splashScene) {
    // Remove all bikes and trails
    if (splashPlayerBike) {
      splashScene.remove(splashPlayerBike);
      for (let segment of splashPlayerBike.userData.trail) {
        splashScene.remove(segment);
      }
    }
    
    for (let aiBike of splashAIBikes) {
      splashScene.remove(aiBike);
      for (let segment of aiBike.userData.trail) {
        splashScene.remove(segment);
      }
    }
    
    // Remove obstacles
    for (let obstacle of splashObstacles) {
      splashScene.remove(obstacle);
    }
    
    // Remove powerups
    for (let powerup of splashPowerups) {
      splashScene.remove(powerup);
      if (powerup.userData.light) {
        splashScene.remove(powerup.userData.light);}
    }
    
    // Release renderer and composer
    if (splashRenderer) {
      splashRenderer.dispose();
      splashRenderer = null;
    }
    
    if (splashComposer) {
      splashComposer = null;
    }
  }
}

// Update splash camera
function updateSplashCamera() {
  if (splashCameraViews.length === 0) return;
  
  // Check if it's time to automatically change camera
  const now = Date.now();
  if (now - splashLastCameraChange > 7000) {
    changeSplashCamera();
  }
  
  // Get current view
  const view = splashCameraViews[splashCameraIndex];
  const targetPos = view.getPosition();
  const targetLookAt = view.getTarget();
  
  // Smooth transition to new position
  splashCamera.position.lerp(targetPos, 0.05);
  
  // Create a temporary lookAt point for smooth rotation
  const currentDir = new THREE.Vector3();
  splashCamera.getWorldDirection(currentDir);
  const currentLookAt = splashCamera.position.clone().add(currentDir.multiplyScalar(100));
  
  // Smoothly move lookAt point
  const tempLookAt = new THREE.Vector3().lerpVectors(currentLookAt, targetLookAt, 0.05);
  splashCamera.lookAt(tempLookAt);
}

// Animate splash demo
function animateSplashDemo() {
  if (!splashDemoActive) return;
  
  splashAnimationFrame = requestAnimationFrame(animateSplashDemo);
  
  // Only run animation if splash screen is visible
  if (document.getElementById('splashScreen').style.display === 'none') {
    hideSplashDemo();
    return;
  }
  
  // Get time delta
  const delta = splashClock.getDelta();
  const elapsedTime = splashClock.getElapsedTime();
  
  // Update camera position
  updateSplashCamera();
  
  // Update player movement
  updateSplashPlayer(delta, elapsedTime);
  
  // Update AI bikes
  updateSplashAIBikes(delta, elapsedTime);
  
  // Update powerups
  updateSplashPowerups(elapsedTime);
  
  // Render the scene
  if (splashComposer) {
    // Update shader uniforms
    updateSplashShaders(elapsedTime);
    splashComposer.render();
  } else {
    splashRenderer.render(splashScene, splashCamera);
  }
}

// Update player bike
function updateSplashPlayer(delta, elapsedTime) {
  if (!splashPlayerBike) return;
  
  // Make player move forward at constant speed
  const moveStep = splashPlayerDirection.clone().multiplyScalar(PLAYER_SPEED * delta * 60);
  const newPosition = splashPlayerBike.position.clone().add(moveStep);
  
  // Check for collisions before moving
  let collision = checkSplashPlayerCollision(newPosition);
  
  if (collision) {
    // Change direction on collision
    if (Math.random() > 0.5) {
      // Turn left
      splashPlayerDirection.set(splashPlayerDirection.z, 0, -splashPlayerDirection.x);
    } else {
      // Turn right
      splashPlayerDirection.set(-splashPlayerDirection.z, 0, splashPlayerDirection.x);
    }
    
    // Update bike rotation to match new direction
    splashPlayerBike.rotation.y = -Math.atan2(splashPlayerDirection.z, splashPlayerDirection.x);
  } else {
    // Move if no collision
    splashPlayerBike.position.copy(newPosition);
  }
  
  // Apply slight tilt when turning
  const tiltAmount = Math.sin(elapsedTime * 2) * 0.05;
  splashPlayerBike.rotation.z = tiltAmount;
}

// Check player collision with boundaries and obstacles
function checkSplashPlayerCollision(newPosition) {
  // Check world boundaries
  if (
    Math.abs(newPosition.x) > WORLD_SIZE/2 - 5 ||
    Math.abs(newPosition.z) > WORLD_SIZE/2 - 5
  ) {
    return true;
  }
  
  // Check obstacles
  for (let obstacle of splashObstacles) {
    const sizeMultiplier = obstacle.userData.sizeMultiplier || 1;
    const minDistance = 10 * sizeMultiplier;
    
    if (newPosition.distanceTo(obstacle.position) < minDistance) {
      return true;
    }
  }
  
  return false;
}

// Update AI bikes
function updateSplashAIBikes(delta, elapsedTime) {
  for (let aiBike of splashAIBikes) {
    // Make AI move forward
    const moveStep = aiBike.userData.direction.clone().multiplyScalar(aiBike.userData.speed * delta * 60);
    const newPosition = aiBike.position.clone().add(moveStep);
    
    // Check for collisions
    let collision = checkSplashAICollision(aiBike, newPosition);
    
    if (collision) {
      // Change direction on collision
      if (Math.random() > 0.5) {
        // Turn left
        aiBike.userData.direction.set(aiBike.userData.direction.z, 0, -aiBike.userData.direction.x);
      } else {
        // Turn right
        aiBike.userData.direction.set(-aiBike.userData.direction.z, 0, aiBike.userData.direction.x);
      }
      
      // Update bike rotation to match new direction
      aiBike.rotation.y = -Math.atan2(aiBike.userData.direction.z, aiBike.userData.direction.x);
    } else {
      // Move if no collision
      aiBike.position.copy(newPosition);
    }
    
    // Apply slight tilt and bob when moving
    const tiltAmount = Math.sin(elapsedTime * 2 + aiBike.position.x * 0.1) * 0.05;
    aiBike.rotation.z = tiltAmount;
    
    // Occasional random direction changes for more interesting motion
    if (Math.random() < 0.005) {
      // Randomly change direction rarely
      if (Math.random() > 0.5) {
        // Turn left
        aiBike.userData.direction.set(aiBike.userData.direction.z, 0, -aiBike.userData.direction.x);
      } else {
        // Turn right
        aiBike.userData.direction.set(-aiBike.userData.direction.z, 0, aiBike.userData.direction.x);
      }
      
      // Update bike rotation to match new direction
      aiBike.rotation.y = -Math.atan2(aiBike.userData.direction.z, aiBike.userData.direction.x);
    }
  }
}

// Check AI collision with boundaries and obstacles
function checkSplashAICollision(aiBike, newPosition) {
  // Check world boundaries
  if (
    Math.abs(newPosition.x) > WORLD_SIZE/2 - 5 ||
    Math.abs(newPosition.z) > WORLD_SIZE/2 - 5
  ) {
    return true;
  }
  
  // Check obstacles
  for (let obstacle of splashObstacles) {
    const sizeMultiplier = obstacle.userData.sizeMultiplier || 1;
    const minDistance = 10 * sizeMultiplier;
    
    if (newPosition.distanceTo(obstacle.position) < minDistance) {
      return true;
    }
  }
  
  // Check collision with player bike (optional - makes AI avoid player)
  if (splashPlayerBike && newPosition.distanceTo(splashPlayerBike.position) < 10) {
    return true;
  }
  
  return false;
}

// Update powerups (animation)
function updateSplashPowerups(elapsedTime) {
  // Animate powerups (hover and pulse)
  for (let powerup of splashPowerups) {
    // Hover motion
    if (powerup.userData.initialY) {
      const hoverHeight = powerup.userData.initialY + Math.sin(elapsedTime * 2) * 0.5;
      powerup.position.y = hoverHeight;
    }
    
    // Rotate slowly
    powerup.rotation.y += 0.01;
    
    // Pulse light if present
    if (powerup.userData.light) {
      const baseBrightness = 0.7 * (1 + effectsConfig.master * 0.2);
      const pulseFactor = Math.sin(elapsedTime * 3) * 0.3;
      powerup.userData.light.intensity = baseBrightness + pulseFactor;
      
      // Make sure light follows powerup position
      powerup.userData.light.position.copy(powerup.position);
    }
  }
}

// Update shader uniforms for effects
function updateSplashShaders(elapsedTime) {
  // Only update if composer is initialized
  if (!splashComposer) return;
  
  // Update time uniforms in shaders
  for (let i = 0; i < splashComposer.passes.length; i++) {
    const pass = splashComposer.passes[i];
    
    if (pass.uniforms && pass.uniforms.time) {
      pass.uniforms.time.value = elapsedTime;
    }
  }
}

/* ------------ Add this to your game to attach the splash demo ------------ */
// Load the splash demo
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the splash demo when page loads
  setTimeout(initSplashDemo, 500);
});
