/* ------------------ GAME WORLD CREATION ------------------ */

// Game world objects storage
let obstacles = [];

function createWorldBoundaries() {
  // Safety check
  if (!window.RENDERER || !window.RENDERER.scene) {
    console.error("RENDERER.scene is not initialized yet. Cannot create world boundaries.");
    return; // Exit the function if RENDERER.scene is not available
  }
  
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
    RENDERER.scene.add(mesh);
    obstacles.push(mesh);
  });
}

function createSponsorMessages() {
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

    RENDERER.scene.add(glowPlane);
    RENDERER.scene.add(plane);
  });
}

function createObstacle() {
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
      // BoxGeometry(width, height, depth)
      geometry = new THREE.BoxGeometry(
        10 * sizeMultiplier,
        15 * sizeMultiplier,
        10 * sizeMultiplier
      );
      break;
    case "cylinder":
      // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
      const radius = 5 * sizeMultiplier;
      geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        20 * sizeMultiplier,
        8
      );
      break;
    case "tetrahedron":
      // TetrahedronGeometry(radius, detail)
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

  // Store the size multiplier for collision detection adjustments
  obstacle.userData = { sizeMultiplier: sizeMultiplier };

  // Find valid position (same as before, but with adjusted distance checks)
  let validPosition = false;
  while (!validPosition) {
    const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
    const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
    const distToPlayer = new THREE.Vector3(x, 0, z).distanceTo(PLAYER.bike.position);
    let tooCloseToAI = false;

    for (let ai of AI.bikes) {
      // Adjust minimum distance based on obstacle size
      if (new THREE.Vector3(x, 0, z).distanceTo(ai.position) < 50 + (10 * sizeMultiplier)) {
        tooCloseToAI = true;
        break;
      }
    }

    // Adjust minimum distance based on obstacle size
    if (distToPlayer > (50 + (10 * sizeMultiplier)) && !tooCloseToAI) {
      // Properly position obstacles to stand firmly on the floor
      // For boxes and tetrahedrons, align bottom with floor
      if (type.geoType === "box") {
        obstacle.position.set(x, (15 * sizeMultiplier) / 2, z);
      } else if (type.geoType === "tetrahedron") {
        // Tetrahedron origin is at center, needs to be raised to stand on floor
        obstacle.position.set(x, (10 * sizeMultiplier) / 2, z);
      } else if (type.geoType === "cylinder") {
        // Cylinder height is along y-axis, origin at center
        obstacle.position.set(x, (20 * sizeMultiplier) / 2, z);
      }
      validPosition = true;
    }
  }

  RENDERER.scene.add(obstacle);
  obstacles.push(obstacle);
  
  return obstacle;
}