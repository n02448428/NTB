/* ------------------ SPLASH SCREEN PREVIEW ------------------ */

// Preview system variables
const PREVIEW = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    cameraTargets: [],
    currentCameraTargetIndex: 0,
    cameraState: {
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      progress: 0,
      duration: 5  // Seconds to move between targets
    },
    animationFrameId: null,
    isActive: false
  };
  
  function setupSplashPreview() {
    // Create a separate scene for the preview
    PREVIEW.scene = new THREE.Scene();
    PREVIEW.scene.background = new THREE.Color(0x000011);
  
    // Create camera
    PREVIEW.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
    // Create renderer that will render to a background canvas
    const previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'previewCanvas';
    previewCanvas.style.position = 'fixed';
    previewCanvas.style.top = '0';
    previewCanvas.style.left = '0';
    previewCanvas.style.width = '100%';
    previewCanvas.style.height = '100%';
    previewCanvas.style.zIndex = '999'; // Below the splash content but above the game
  
    // Insert the canvas before the splash screen content
    const splashScreen = document.getElementById('splashScreen');
    document.body.insertBefore(previewCanvas, splashScreen);
  
    // Add click event listener to change camera view when clicking outside buttons
    previewCanvas.addEventListener('click', function (e) {
      // Check if we clicked on a button (don't change view if clicked on UI elements)
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const clickedOnUI = elements.some(el =>
        el.tagName === 'BUTTON' ||
        el.id === 'playerNameInput' ||
        el.tagName === 'INPUT');
  
      if (!clickedOnUI) {
        // Force immediate camera transition to new target
        selectNextCameraTarget();
        PREVIEW.cameraState.progress = 0; // Reset progress for smooth transition
      }
    });
  
    PREVIEW.renderer = new THREE.WebGLRenderer({
      canvas: previewCanvas,
      antialias: true,
      alpha: true
    });
    PREVIEW.renderer.setSize(window.innerWidth, window.innerHeight);
  
    // Setup composer for the same visual effects
    setupPreviewEffects();
  
    // Populate preview scene with content
    populatePreviewScene();
  
    // Add dark overlay to splashScreen to make it semi-transparent
    splashScreen.style.background = 'rgba(0, 0, 0, 0.7)';
  
    // Expose functions
    PREVIEW.showSplashPreview = showSplashPreview;
    PREVIEW.hideSplashPreview = hideSplashPreview;
  }
  
  function setupPreviewEffects() {
    PREVIEW.composer = new THREE.EffectComposer(PREVIEW.renderer);
    const previewRenderPass = new THREE.RenderPass(PREVIEW.scene, PREVIEW.camera);
    PREVIEW.composer.addPass(previewRenderPass);
  
    // Apply the same post-processing effects as the main game
    const previewBloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8 * RENDERER.effectsConfig.bloom,
      0.3 + (RENDERER.effectsConfig.bloom * 0.2),
      0.85 - (RENDERER.effectsConfig.bloom * 0.05)
    );
    PREVIEW.composer.addPass(previewBloomPass);
  
    const previewPixelPass = new THREE.ShaderPass(PixelShader);
    previewPixelPass.uniforms.pixelSize.value = RENDERER.effectsConfig.pixel;
    PREVIEW.composer.addPass(previewPixelPass);
  
    const previewColorPass = new THREE.ShaderPass(ColorShader);
    previewColorPass.uniforms.hueShift.value = RENDERER.effectsConfig.hueShift;
    previewColorPass.uniforms.saturation.value = RENDERER.effectsConfig.saturation;
    previewColorPass.uniforms.colorPulse.value = RENDERER.effectsConfig.colorPulse;
    previewColorPass.uniforms.speed.value = RENDERER.effectsConfig.speed;
    PREVIEW.composer.addPass(previewColorPass);
  
    const previewScanlinePass = new THREE.ShaderPass(ScanlineShader);
    previewScanlinePass.uniforms.intensity.value = RENDERER.effectsConfig.scanline;
    previewScanlinePass.uniforms.speed.value = RENDERER.effectsConfig.speed;
    PREVIEW.composer.addPass(previewScanlinePass);
  }
  
  function populatePreviewScene() {
    // Basic lighting
    PREVIEW.scene.add(new THREE.AmbientLight(0x444444));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 100, 0);
    PREVIEW.scene.add(directionalLight);
  
    // Grid floor with color from settings
    const gridColor = new THREE.Color(RENDERER.effectsConfig.gridColor);
    const gridHelper = new THREE.GridHelper(CONFIG.WORLD_SIZE, 50, gridColor, 0x004488);
    PREVIEW.scene.add(gridHelper);
  
    // Add world boundaries
    createPreviewBoundaries();
  
    // Add sponsor messages (same as main game)
    createPreviewSponsorMessages();
  
    // Add some bikes, obstacles and powerups to make the preview interesting
    createPreviewBikes();
    createPreviewObstacles();
    createPreviewPowerups();
  
    // Add portals for visual interest
    createPreviewPortals();
  
    // Set up camera targets for preview movement
    setupCameraTargets();
  }
  
  function createPreviewBoundaries() {
    const wallHeight = 20;
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x0088ff,
      emissive: 0x0044aa,
      transparent: true,
      opacity: 0.3 + (RENDERER.effectsConfig.master * 0.1)
    });
  
    const walls = [
      { size: [CONFIG.WORLD_SIZE, wallHeight, 2], pos: [0, wallHeight / 2, -CONFIG.WORLD_SIZE / 2] }, // North
      { size: [CONFIG.WORLD_SIZE, wallHeight, 2], pos: [0, wallHeight / 2, CONFIG.WORLD_SIZE / 2] },  // South
      { size: [2, wallHeight, CONFIG.WORLD_SIZE], pos: [CONFIG.WORLD_SIZE / 2, wallHeight / 2, 0] },  // East
      { size: [2, wallHeight, CONFIG.WORLD_SIZE], pos: [-CONFIG.WORLD_SIZE / 2, wallHeight / 2, 0] }  // West
    ];
  
    walls.forEach(wall => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...wall.size),
        wallMaterial
      );
      mesh.position.set(...wall.pos);
      PREVIEW.scene.add(mesh);
    });
  }
  
  function createPreviewSponsorMessages() {
    const sponsorMessage = ["SPONSORS:", "YOUR AD HERE", "dm on x"];
    const lineHeight = 36;
  
    const walls = [
      { position: new THREE.Vector3(0, 10, -CONFIG.WORLD_SIZE / 2 + 2), rotation: [0, 0, 0] },
      { position: new THREE.Vector3(0, 10, CONFIG.WORLD_SIZE / 2 - 2), rotation: [0, Math.PI, 0] },
      { position: new THREE.Vector3(-CONFIG.WORLD_SIZE / 2 + 2, 10, 0), rotation: [0, Math.PI / 2, 0] },
      { position: new THREE.Vector3(CONFIG.WORLD_SIZE / 2 - 2, 10, 0), rotation: [0, -Math.PI / 2, 0] }
    ];
  
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
  
    context.fillStyle = '#000033';
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    context.strokeStyle = '#00ffff';
    context.lineWidth = 4;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  
    context.fillStyle = '#00ffff';
    context.font = 'bold 40px "Courier New"';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
  
    const startY = canvas.height / 2 - ((sponsorMessage.length - 1) * lineHeight) / 2;
  
    sponsorMessage.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      context.fillText(line, canvas.width / 2, y);
    });
  
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    });
  
    walls.forEach(wallData => {
      const geometry = new THREE.PlaneGeometry(35, 20);
      const plane = new THREE.Mesh(geometry, material);
  
      plane.position.copy(wallData.position);
      plane.rotation.x = wallData.rotation[0];
      plane.rotation.y = wallData.rotation[1];
      plane.rotation.z = wallData.rotation[2];
  
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
      });
  
      const glowGeometry = new THREE.PlaneGeometry(37, 22);
      const glowPlane = new THREE.Mesh(glowGeometry, glowMaterial);
      glowPlane.position.copy(wallData.position);
      glowPlane.rotation.copy(plane.rotation);
  
      // Offset the glow behind the text
      if (wallData.rotation[1] === 0) {
        glowPlane.position.z += 0.1;
      } else if (Math.abs(wallData.rotation[1]) === Math.PI) {
        glowPlane.position.z -= 0.1;
      } else if (wallData.rotation[1] === -Math.PI / 2) {
        glowPlane.position.x -= 0.1;
      }
  
      PREVIEW.scene.add(glowPlane);
      PREVIEW.scene.add(plane);
    });
  }
  
  function createPreviewBikes() {
    // Create several bikes in the preview scene
    for (let i = 0; i < 5; i++) {
      createPreviewBike(i);
    }
  }
  
  function createPreviewBike(index) {
    const hue = (index * 60) % 360;
    const bikeColor = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
  
    const bike = new THREE.Group();
  
    const bikeBodyMaterial = new THREE.MeshPhongMaterial({
      color: bikeColor,
      emissive: bikeColor,
      emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.3),
      shininess: 30
    });
  
    // Main body and parts
    const parts = [
      // Main body
      { geo: new THREE.BoxGeometry(4, 6, 0.5), pos: [0, 0, 0], mat: bikeBodyMaterial },
      // Front edge
      { geo: new THREE.BoxGeometry(1, 6, 0.75), pos: [2.5, 0, 0], mat: bikeBodyMaterial }
    ];
  
    // Create edge light material
    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: bikeColor,
      emissive: bikeColor,
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
      bike.add(mesh);
    });
  
    // Add edge parts
    edgeParts.forEach(part => {
      const mesh = new THREE.Mesh(part.geo, edgeMaterial);
      mesh.position.set(...part.pos);
      bike.add(mesh);
    });
  
    // Add lights
    const centerLight = new THREE.PointLight(
      bikeColor,
      1 + (RENDERER.effectsConfig.master * 0.5),
      8 + (RENDERER.effectsConfig.master * 3)
    );
    centerLight.position.set(0, 0, 0);
    bike.add(centerLight);
  
    const frontLight = new THREE.PointLight(
      bikeColor,
      0.7 + (RENDERER.effectsConfig.master * 0.3),
      5 + (RENDERER.effectsConfig.master * 2)
    );
    frontLight.position.set(2.5, 0, 0);
    bike.add(frontLight);
  
    // Position the bike
    const x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
    const z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
    bike.position.set(x, 3, z);
  
    // Set random rotation
    const rotation = Math.random() * Math.PI * 2;
    bike.rotation.y = rotation;
  
    // Add to scene
    PREVIEW.scene.add(bike);
  
    // Create a trail for this bike
    createPreviewTrail(bike, bikeColor);
  
    // Add this bike as a potential camera target
    PREVIEW.cameraTargets.push({
      type: 'bike',
      position: bike.position.clone(),
      lookAt: new THREE.Vector3(
        bike.position.x + Math.cos(rotation) * 30,
        3,
        bike.position.z + Math.sin(rotation) * 30
      )
    });
  
    return bike;
  }
  
  function createPreviewTrail(bike, color) {
    // Create a trail behind the bike
    const trailLength = 15 + Math.floor(Math.random() * 10);
    const trailDirection = new THREE.Vector3(
      -Math.sin(bike.rotation.y),
      0,
      -Math.cos(bike.rotation.y)
    );
  
    for (let i = 0; i < trailLength; i++) {
      const geometry = new THREE.BoxGeometry(2, 6, 0.5);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.7 + (RENDERER.effectsConfig.master * 0.3),
        transparent: true,
        opacity: 0.8
      });
  
      const segment = new THREE.Mesh(geometry, material);
      const offset = trailDirection.clone().multiplyScalar(i * 3);
      segment.position.copy(bike.position).add(offset);
      segment.rotation.y = bike.rotation.y;
  
      PREVIEW.scene.add(segment);
    }
  }
  
  function createPreviewObstacles() {
    // Create random obstacles
    for (let i = 0; i < 40; i++) {
      createPreviewObstacle();
    }
  }
  
  function createPreviewObstacle() {
    // Base obstacle types with their geometry types
    const types = [
      { geoType: "box", color: 0xff5500 },
      { geoType: "cylinder", color: 0x00ff88 },
      { geoType: "tetrahedron", color: 0xffff00 }
    ];
  
    // Select a random type
    const type = types[Math.floor(Math.random() * types.length)];
  
    // Generate a random size multiplier between 1 and 5
    const sizeMultiplier = Math.random() * 5; // 1 to 5
  
    // Create geometry based on type and size
    let geometry;
    switch (type.geoType) {
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
      emissiveIntensity: 0.3 + (RENDERER.effectsConfig.master * 0.2)
    });
  
    const obstacle = new THREE.Mesh(geometry, material);
    // Mark this as a collidable object for camera movement
    obstacle.userData.isObstacle = true;
  
    // Random position
    const x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
    const z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
  
    // Properly position obstacles to stand firmly on the floor
    if (type.geoType === "box") {
      obstacle.position.set(x, (15 * sizeMultiplier) / 2, z);
    } else if (type.geoType === "tetrahedron") {
      obstacle.position.set(x, (10 * sizeMultiplier) / 2, z);
    } else if (type.geoType === "cylinder") {
      obstacle.position.set(x, (20 * sizeMultiplier) / 2, z);
    }
  
    PREVIEW.scene.add(obstacle);
  
    // Add large obstacles as camera targets
    if (sizeMultiplier > 3) {
      PREVIEW.cameraTargets.push({
        type: 'obstacle',
        position: new THREE.Vector3(x, 20, z),
        lookAt: obstacle.position
      });
    }
  
    return obstacle;
  }
  
  function createPreviewPowerups() {
    // Add some powerups for visual interest
    for (let i = 0; i < 20; i++) {
      createPreviewPowerup();
    }
  }
  
  function createPreviewPowerup() {
    const geometry = new THREE.SphereGeometry(3, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.4)
    });
    const powerup = new THREE.Mesh(geometry, material);
  
    // Random position
    const x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
    const z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
    powerup.position.set(x, 3, z);
  
    // Add pulsing light to powerups
    const powerupLight = new THREE.PointLight(
      0xffffff,
      0.7 * (1 + RENDERER.effectsConfig.master),
      15 * (1 + RENDERER.effectsConfig.master)
    );
    powerupLight.position.copy(powerup.position);
    PREVIEW.scene.add(powerupLight);
  
    powerup.userData = { light: powerupLight };
    PREVIEW.scene.add(powerup);
  
    return powerup;
  }
  
  function createPreviewPortals() {
    // Create exit portal
    const exitPortalGroup = new THREE.Group();
    exitPortalGroup.position.set(CONFIG.WORLD_SIZE / 2 - 30, 3, -CONFIG.WORLD_SIZE / 2 + 30);
  
    const exitPortalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
    const exitPortalMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });
    const exitPortal = new THREE.Mesh(exitPortalGeometry, exitPortalMaterial);
    exitPortal.userData.isPortal = true;
    exitPortalGroup.add(exitPortal);
  
    const exitPortalInnerGeometry = new THREE.CircleGeometry(13, 32);
    const exitPortalInnerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const exitPortalInner = new THREE.Mesh(exitPortalInnerGeometry, exitPortalInnerMaterial);
    exitPortalInner.userData.isPortal = true;
    exitPortalGroup.add(exitPortalInner);
  
    PREVIEW.scene.add(exitPortalGroup);
  
    // Add portal as camera target
    PREVIEW.cameraTargets.push({
      type: 'portal',
      position: new THREE.Vector3(exitPortalGroup.position.x - 40, 20, exitPortalGroup.position.z - 40),
      lookAt: exitPortalGroup.position
    });
  
    // Create metaverse portal
    const metaversePortalGroup = new THREE.Group();
    metaversePortalGroup.position.set(-CONFIG.WORLD_SIZE / 2 + 30, 3, -CONFIG.WORLD_SIZE / 2 + 30);
  
    const metaversePortalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
    const metaversePortalMaterial = new THREE.MeshPhongMaterial({
      color: 0x1877F2,
      emissive: 0x1877F2,
      transparent: true,
      opacity: 0.8
    });
    const metaversePortal = new THREE.Mesh(metaversePortalGeometry, metaversePortalMaterial);
    metaversePortalGroup.add(metaversePortal);
  
    const metaversePortalInnerGeometry = new THREE.CircleGeometry(13, 32);
    const metaversePortalInnerMaterial = new THREE.MeshBasicMaterial({
      color: 0x1877F2,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const metaversePortalInner = new THREE.Mesh(metaversePortalInnerGeometry, metaversePortalInnerMaterial);
    metaversePortalGroup.add(metaversePortalInner);
  
    PREVIEW.scene.add(metaversePortalGroup);
  
    // Add metaverse portal as camera target
    PREVIEW.cameraTargets.push({
      type: 'portal',
      position: new THREE.Vector3(metaversePortalGroup.position.x + 40, 20, metaversePortalGroup.position.z - 40),
      lookAt: metaversePortalGroup.position
    });
  }
  
  function setupCameraTargets() {
    // Add overview camera positions
    PREVIEW.cameraTargets.push({
      type: 'overview',
      position: new THREE.Vector3(0, 150, 0),
      lookAt: new THREE.Vector3(0, 0, 0)
    });
  
    PREVIEW.cameraTargets.push({
      type: 'overview',
      position: new THREE.Vector3(CONFIG.WORLD_SIZE / 3, 80, CONFIG.WORLD_SIZE / 3),
      lookAt: new THREE.Vector3(0, 0, 0)
    });
  
    PREVIEW.cameraTargets.push({
      type: 'overview',
      position: new THREE.Vector3(-CONFIG.WORLD_SIZE / 3, 80, -CONFIG.WORLD_SIZE / 3),
      lookAt: new THREE.Vector3(0, 0, 0)
    });
  
    // Ensure we have at least one target to start with
    if (PREVIEW.cameraTargets.length === 0) {
      PREVIEW.cameraTargets.push({
        type: 'default',
        position: new THREE.Vector3(0, 50, 0),
        lookAt: new THREE.Vector3(0, 0, 0)
      });
    }
  
    // Set initial camera position and target
    selectNextCameraTarget();
  }
  
  function selectNextCameraTarget() {
    const prevTargetIndex = PREVIEW.currentCameraTargetIndex;
  
    // Choose next target, avoiding same type in a row if possible
    let attempts = 0;
    const prevType = PREVIEW.cameraTargets[prevTargetIndex]?.type;
  
    do {
      PREVIEW.currentCameraTargetIndex = Math.floor(Math.random() * PREVIEW.cameraTargets.length);
      attempts++;
    } while (
      attempts < 5 &&
      PREVIEW.cameraTargets.length > 3 &&
      PREVIEW.cameraTargets[PREVIEW.currentCameraTargetIndex].type === prevType
    );
  
    const currentTarget = PREVIEW.cameraTargets[PREVIEW.currentCameraTargetIndex];
  
    // Set up the camera transition
    PREVIEW.cameraState.position = PREVIEW.camera.position.clone();
  
    // If this is the first target, directly set camera position
    if (prevTargetIndex === PREVIEW.currentCameraTargetIndex) {
      PREVIEW.camera.position.copy(currentTarget.position);
      PREVIEW.camera.lookAt(currentTarget.lookAt);
    }
  
    // Get current camera target
    const lookAtDir = new THREE.Vector3();
    PREVIEW.camera.getWorldDirection(lookAtDir);
    lookAtDir.multiplyScalar(50).add(PREVIEW.camera.position);
  
    PREVIEW.cameraState.target = lookAtDir;
    PREVIEW.cameraState.progress = 0;
  
    // Fixed duration of 7 seconds
    PREVIEW.cameraState.duration = 7.0;
  }
  
  function updatePreviewCamera(delta) {
    const currentTarget = PREVIEW.cameraTargets[PREVIEW.currentCameraTargetIndex];
  
    // Update transition progress
    PREVIEW.cameraState.progress += delta / PREVIEW.cameraState.duration;
  
    if (PREVIEW.cameraState.progress >= 1) {
      // Transition complete, select next target
      selectNextCameraTarget();
      return;
    }
  
    // Smooth camera movement using ease-in-out
    const t = UTILS.smoothstep(PREVIEW.cameraState.progress);
  
    // Calculate new position
    const newPosition = new THREE.Vector3();
    newPosition.lerpVectors(
      PREVIEW.cameraState.position,
      currentTarget.position,
      t
    );
  
    // Check if the path intersects with any objects
    const rayDirection = new THREE.Vector3().subVectors(newPosition, PREVIEW.camera.position).normalize();
    const distance = PREVIEW.camera.position.distanceTo(newPosition);
  
    const raycaster = new THREE.Raycaster(PREVIEW.camera.position, rayDirection, 0, distance);
    // Filter which objects to check for collision (only obstacles)
    const intersects = raycaster.intersectObjects(PREVIEW.scene.children.filter(obj => {
      return obj.type === 'Mesh' &&
        !obj.userData.isPortal &&
        ['BoxGeometry', 'CylinderGeometry', 'TetrahedronGeometry'].includes(obj.geometry.type);
    }));
  
    // If no intersections, use the calculated position
    if (intersects.length === 0) {
      PREVIEW.camera.position.copy(newPosition);
    } else {
      // If there's an intersection, raise the camera to go over the obstacle
      const highestPoint = Math.max(...intersects.map(hit => hit.object.position.y + 20));
      newPosition.y = Math.max(newPosition.y, highestPoint);
      PREVIEW.camera.position.copy(newPosition);
    }
  
    // Smoothly rotate to look at target
    const currentLookAt = new THREE.Vector3();
    PREVIEW.camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(50).add(PREVIEW.camera.position);
  
    const targetLookAt = new THREE.Vector3().lerpVectors(
      PREVIEW.cameraState.target,
      currentTarget.lookAt,
      t
    );
  
    PREVIEW.camera.lookAt(targetLookAt);
  }
  
  function animateSplashPreview() {
    if (!PREVIEW.isActive) return;
  
    PREVIEW.animationFrameId = requestAnimationFrame(animateSplashPreview);
  
    const delta = RENDERER.clock.getDelta();
    const elapsedTime = RENDERER.clock.getElapsedTime();
  
    // Update camera movement
    updatePreviewCamera(delta);
  
    // Update time uniforms for shader effects
    if (PREVIEW.composer.passes) {
      PREVIEW.composer.passes.forEach(pass => {
        if (pass.uniforms && pass.uniforms.time) {
          pass.uniforms.time.value = elapsedTime;
        }
      });
    }
  
    // Render the preview scene
    PREVIEW.composer.render();
  }
  
  function showSplashPreview() {
    if (!PREVIEW.scene) {
      setupSplashPreview();
    }
    
    const previewCanvas = document.getElementById('previewCanvas');
    if (previewCanvas) {
      previewCanvas.style.display = 'block';
    }
    
    PREVIEW.isActive = true;
    animateSplashPreview();
  }
  
  function hideSplashPreview() {
    const previewCanvas = document.getElementById('previewCanvas');
    if (previewCanvas) {
      previewCanvas.style.display = 'none';
    }
    
    // Stop animation loop
    if (PREVIEW.animationFrameId) {
      cancelAnimationFrame(PREVIEW.animationFrameId);
      PREVIEW.animationFrameId = null;
    }
    
    PREVIEW.isActive = false;
  }