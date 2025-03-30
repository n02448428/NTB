/* ------------------ PLAYER BIKE AND TRAIL ------------------ */

// Player variables
const PLAYER = {
    bike: null,
    direction: null,
    trail: [],
    tailLength: 5,
    score: 0
  };
  
  function createPlayerBike() {
    PLAYER.bike = new THREE.Group();
    const playerColor = new THREE.Color(RENDERER.effectsConfig.playerColor);
  
    const bikeBodyMaterial = new THREE.MeshPhongMaterial({
      color: playerColor,
      emissive: playerColor,
      emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.3),
      shininess: 30
    });
  
    RENDERER.materialsToUpdate.player = bikeBodyMaterial;
  
    // Main body and parts
    const parts = [
      // Main body
      { geo: new THREE.BoxGeometry(4, 6, 0.5), pos: [0, 0, 0], mat: bikeBodyMaterial },
      // Front edge
      { geo: new THREE.BoxGeometry(1, 6, 0.75), pos: [2.5, 0, 0], mat: bikeBodyMaterial }
    ];
  
    // Create edge light material
    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: playerColor,
      emissive: playerColor,
      emissiveIntensity: 1.5 + (RENDERER.effectsConfig.master * 0.5),
      transparent: true,
      opacity: 0.9
    });
  
    // Edge parts
    const edgeParts = [
      // Top edge
      { geo: new THREE.BoxGeometry(4.5, 0.2, 0.6), pos: [0, 3, 0] },
      // Bottom edge
      { geo: new THREE.BoxGeometry(4.5, 0.2, 0.6), pos: [0, -3, 0] },
      // Front edge
      { geo: new THREE.BoxGeometry(0.2, 6, 0.6), pos: [2.9, 0, 0] },
      // Rear edge
      { geo: new THREE.BoxGeometry(0.2, 6, 0.6), pos: [-2, 0, 0] }
    ];
  
    // Add main parts
    parts.forEach(part => {
      const mesh = new THREE.Mesh(part.geo, part.mat);
      mesh.position.set(...part.pos);
      PLAYER.bike.add(mesh);
    });
  
    // Add edge parts
    edgeParts.forEach(part => {
      const mesh = new THREE.Mesh(part.geo, edgeMaterial);
      mesh.position.set(...part.pos);
      PLAYER.bike.add(mesh);
    });
  
    // Add lights
    const centerLight = new THREE.PointLight(
      playerColor,
      1 + (RENDERER.effectsConfig.master * 0.5),
      8 + (RENDERER.effectsConfig.master * 3)
    );
    centerLight.position.set(0, 0, 0);
    PLAYER.bike.add(centerLight);
  
    const frontLight = new THREE.PointLight(
      playerColor,
      0.7 + (RENDERER.effectsConfig.master * 0.3),
      5 + (RENDERER.effectsConfig.master * 2)
    );
    frontLight.position.set(2.5, 0, 0);
    PLAYER.bike.add(frontLight);
  
    PLAYER.bike.position.set(-CONFIG.WORLD_SIZE / 4, 3, 0);
    RENDERER.scene.add(PLAYER.bike);
  
    // Player starts facing +X
    PLAYER.direction = new THREE.Vector3(1, 0, 0);
  
    // Store original rotation for tilt calculations
    PLAYER.bike.userData = {
      originalRotation: new THREE.Euler().copy(PLAYER.bike.rotation),
      targetTilt: 0,
      currentTilt: 0
    };
  }
  
  function addPlayerTrail() {
    const playerColor = new THREE.Color(RENDERER.effectsConfig.playerColor);
    const geometry = new THREE.BoxGeometry(2, 6, 0.5);
    const material = new THREE.MeshPhongMaterial({
      color: playerColor,
      emissive: playerColor,
      emissiveIntensity: 0.7 + (RENDERER.effectsConfig.master * 0.3),
      transparent: true,
      opacity: 0.8
    });
    const segment = new THREE.Mesh(geometry, material);
    segment.position.copy(PLAYER.bike.position);
  
    segment.rotation.y = Math.atan2(PLAYER.direction.z, PLAYER.direction.x);
    segment.rotation.z = PLAYER.bike.rotation.z; // Match bike tilt
  
    RENDERER.scene.add(segment);
  
    PLAYER.trail.push({ mesh: segment, time: RENDERER.clock.getElapsedTime() });
    if (PLAYER.trail.length > PLAYER.tailLength) {
      const oldest = PLAYER.trail.shift();
      RENDERER.scene.remove(oldest.mesh);
    }
  }
  
  function updatePlayerMovement(delta) {
    // Move player
    const playerMoveStep = PLAYER.direction.clone().multiplyScalar(CONFIG.PLAYER_SPEED);
    PLAYER.bike.position.add(playerMoveStep);
    const playerAngle = Math.atan2(PLAYER.direction.z, PLAYER.direction.x);
    PLAYER.bike.rotation.y = -playerAngle;
  
    // Add trail at certain distances
    if (
      PLAYER.trail.length === 0 ||
      PLAYER.bike.position.distanceTo(PLAYER.trail[PLAYER.trail.length - 1].mesh.position) > 3
    ) {
      addPlayerTrail();
    }
  }
  
  function updatePlayerCamera() {
    if (!RENDERER.camera || !PLAYER.bike) return;
    
    // Update camera position for smooth following
    const isPortrait = window.innerHeight > window.innerWidth;
    const cameraOffset = PLAYER.direction.clone().multiplyScalar(isPortrait ? -50 : -30);
    cameraOffset.y = isPortrait ? 30 : 15;
    const targetPosition = PLAYER.bike.position.clone().add(cameraOffset);
    RENDERER.camera.position.lerp(targetPosition, 0.1);
    RENDERER.camera.lookAt(PLAYER.bike.position);
  }
  
  function updateScore() {
    document.getElementById('trailCounter').textContent = PLAYER.score;
    document.getElementById('playerScore').textContent = PLAYER.score;
  }
  
  function resetPlayer() {
    // Clear trail
    PLAYER.trail.forEach(segment => RENDERER.scene.remove(segment.mesh));
    PLAYER.trail = [];
    
    // Reset variables
    PLAYER.tailLength = 5;
    PLAYER.score = 0;
    
    // Update UI
    updateScore();
  }