/* ------------------ PLAYER BIKE AND TRAIL ------------------ */

// Player variables
const PLAYER = {
    bike: null,
    direction: null,
    trail: [],
    tailLength: 5,
    score: 0
  };

  const trailSegmentPool = [];
  
  function createPlayerBike() {
    // Create an empty group for the bike
    PLAYER.bike = new THREE.Group();
    
    // Store the player color for use in the model
    const playerColor = new THREE.Color(RENDERER.effectsConfig.playerColor);
    
    // Add to materials to update registry for color effects
    const bikeBodyMaterial = new THREE.MeshPhongMaterial({
      color: playerColor,
      emissive: playerColor,
      emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.3),
      shininess: 30
    });
    RENDERER.materialsToUpdate.player = bikeBodyMaterial;
    
    // Set initial position
    PLAYER.bike.position.set(CONFIG.SPAWN_POINT_X, CONFIG.SPAWN_POINT_Y, CONFIG.SPAWN_POINT_Z);
    RENDERER.scene.add(PLAYER.bike);
    
    // Player starts facing +X
    PLAYER.direction = new THREE.Vector3(1, 0, 0);
    
    // Store original rotation for tilt calculations
    PLAYER.bike.userData = {
      originalRotation: new THREE.Euler().copy(PLAYER.bike.rotation),
      targetTilt: 0,
      currentTilt: 0
    };
    
    // Create a temporary bike while loading
    createTemporaryBike();
    
    // Load the GLB model
    const loader = new THREE.GLTFLoader();
    loader.load(
      // Path to your GLB file
      'models/custom_bike.glb',
      
      // Success callback
      function(gltf) {
        console.log('Custom bike model loaded successfully!');
        
        // Remove temporary bike
        PLAYER.bike.children.forEach(child => {
          if (child.userData && child.userData.isTemporary) {
            PLAYER.bike.remove(child);
          }
        });
        
        // You might need to adjust the scale and rotation
        // depending on how your model was exported
        gltf.scene.scale.set(10, 10, 10); // Adjust if needed
        gltf.scene.rotation.y = Math.PI; // This makes it face forward (adjust if needed)
        
        // Add the model to the bike group
        PLAYER.bike.add(gltf.scene);
        
        // Apply materials and emissive properties
        gltf.scene.traverse(function(child) {
          if (child.isMesh) {
            // Apply emissive properties to make it glow
            if (child.material) {
              child.material.emissive = playerColor;
              child.material.emissiveIntensity = 0.8 + (RENDERER.effectsConfig.master * 0.3);
            }
          }
        });
        
        // Add bike lights
        addBikeLights();
      },
      
      // Progress callback
      function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      
      // Error callback
      function(error) {
        console.error('Error loading bike model:', error);
        // Keep the temporary bike if loading fails
      }
    );
  }
  
  // Create a temporary bike while the custom model loads
  function createTemporaryBike() {
    const tempMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(RENDERER.effectsConfig.playerColor),
      emissive: new THREE.Color(RENDERER.effectsConfig.playerColor),
      emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.3),
      shininess: 30
    });
    
    // Main body
    const bodyGeo = new THREE.BoxGeometry(4, 6, 0.5);
    const tempBody = new THREE.Mesh(bodyGeo, tempMaterial);
    tempBody.userData.isTemporary = true;
    PLAYER.bike.add(tempBody);
    
    // Add edge parts and lights
    addBikeLights();
  }
  
  // Add lights to make the bike glow
  function addBikeLights() {
    const playerColor = new THREE.Color(RENDERER.effectsConfig.playerColor);
    
    // Center light
    const centerLight = new THREE.PointLight(
      playerColor,
      1 + (RENDERER.effectsConfig.master * 0.5),
      8 + (RENDERER.effectsConfig.master * 3)
    );
    centerLight.position.set(0, 0, 0);
    PLAYER.bike.add(centerLight);
    
    // Front light
    const frontLight = new THREE.PointLight(
      playerColor,
      0.7 + (RENDERER.effectsConfig.master * 0.3),
      5 + (RENDERER.effectsConfig.master * 2)
    );
    frontLight.position.set(2.5, 0, 0);
    PLAYER.bike.add(frontLight);
  }
  
  function addPlayerTrail() {
    const playerColor = new THREE.Color(RENDERER.effectsConfig.playerColor);
    
    // Get segment from pool or create new
    let segment;
    if (trailSegmentPool.length > 0) {
      segment = trailSegmentPool.pop();
      // Update material color
      segment.material.color.set(playerColor);
      segment.material.emissive.set(playerColor);
      segment.material.emissiveIntensity = 0.7 + (RENDERER.effectsConfig.master * 0.3);
      // Make visible again
      segment.visible = true;
    } else {
      // Create new if pool empty
      const geometry = new THREE.BoxGeometry(2, 6, 0.5);
      const material = new THREE.MeshPhongMaterial({
        color: playerColor,
        emissive: playerColor,
        emissiveIntensity: 0.7 + (RENDERER.effectsConfig.master * 0.3),
        transparent: true,
        opacity: 0.8
      });
      segment = new THREE.Mesh(geometry, material);
    }
    
    segment.position.copy(PLAYER.bike.position);
    segment.rotation.y = Math.atan2(PLAYER.direction.z, PLAYER.direction.x);
    segment.rotation.z = PLAYER.bike.rotation.z;
    
    RENDERER.scene.add(segment);
    
    PLAYER.trail.push({ mesh: segment, time: RENDERER.clock.getElapsedTime() });
    if (PLAYER.trail.length > PLAYER.tailLength) {
      const oldest = PLAYER.trail.shift();
      RENDERER.scene.remove(oldest.mesh);
      // Instead of removing, return to pool
      oldest.mesh.visible = false;
      trailSegmentPool.push(oldest.mesh);
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
