/* ------------------ AI SYSTEM ------------------ */

// AI System variables
const AI = {
    bikes: [],
    generation: 1,
    spawnInterval: null,
    timer: 0,
    knowledgeBase: { ...CONFIG.KNOWLEDGE_BASE }
  };
  
  function createAIBike() {
    const aiIndex = AI.bikes.length;
    const hue = (aiIndex * 60) % 360;
    const aiColor = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
  
    const aiBike = new THREE.Group();
    aiBike.userData = {
      id: Date.now() + aiIndex,
      direction: new THREE.Vector3(-1, 0, 0), // AI starts facing -X
      trail: [],
      tailLength: 5,
      speed: CONFIG.AI_SPEED_BASE * (1 + (AI.generation - 1) * 0.05),
      color: aiColor,
      generation: AI.generation,
      lastTurnTime: 0,
      lastPosition: new THREE.Vector3(),
      crashCount: 0,
      powerupsCollected: 0,
      originalRotation: new THREE.Euler(0, 0, 0),
      targetTilt: 0,
      currentTilt: 0,
      // Individual AI characteristics that evolve
      characteristics: {
        avoidDistance: AI.knowledgeBase.avoidDistance + (Math.random() - 0.5) * 5,
        powerupWeight: AI.knowledgeBase.powerupWeight + (Math.random() - 0.5) * 10,
        turnRandomness: AI.knowledgeBase.turnRandomness * (0.8 + Math.random() * 0.4),
        preferredTurn: Math.random() > 0.5 ? 'left' : 'right',
        riskTolerance: 0.8 + Math.random() * 0.4
      }
    };
  
    const bikeBodyMaterial = new THREE.MeshPhongMaterial({
      color: aiColor,
      emissive: aiColor,
      emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.3),
      shininess: 30
    });
  
    // Main body and parts - same structure as player bike
    const parts = [
      // Main body
      { geo: new THREE.BoxGeometry(4, 6, 0.5), pos: [0, 0, 0], mat: bikeBodyMaterial },
      // Front edge
      { geo: new THREE.BoxGeometry(1, 6, 0.75), pos: [2.5, 0, 0], mat: bikeBodyMaterial }
    ];
  
    // Create edge light material
    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: aiColor,
      emissive: aiColor,
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
      aiBike.add(mesh);
    });
  
    // Add edge parts
    edgeParts.forEach(part => {
      const mesh = new THREE.Mesh(part.geo, edgeMaterial);
      mesh.position.set(...part.pos);
      aiBike.add(mesh);
    });
  
    // Add lights
    const centerLight = new THREE.PointLight(
      aiColor,
      1 + (RENDERER.effectsConfig.master * 0.5),
      8 + (RENDERER.effectsConfig.master * 3)
    );
    centerLight.position.set(0, 0, 0);
    aiBike.add(centerLight);
  
    const frontLight = new THREE.PointLight(
      aiColor,
      0.7 + (RENDERER.effectsConfig.master * 0.3),
      5 + (RENDERER.effectsConfig.master * 2)
    );
    frontLight.position.set(2.5, 0, 0);
    aiBike.add(frontLight);
  
    // Randomize starting position
    const startOffset = aiIndex * 20;
    aiBike.position.set(CONFIG.WORLD_SIZE / 4, 3, startOffset - (AI.bikes.length * 10));
    RENDERER.scene.add(aiBike);
  
    AI.bikes.push(aiBike);
    updateAICounter();
  
    return aiBike;
  }
  
  function addAITrail(aiBike) {
    const geometry = new THREE.BoxGeometry(2, 6, 0.5);
    const material = new THREE.MeshPhongMaterial({
      color: aiBike.userData.color,
      emissive: aiBike.userData.color,
      emissiveIntensity: 0.7 + (RENDERER.effectsConfig.master * 0.3),
      transparent: true,
      opacity: 0.8
    });
    const segment = new THREE.Mesh(geometry, material);
    segment.position.copy(aiBike.position);
  
    segment.rotation.y = Math.atan2(aiBike.userData.direction.z, aiBike.userData.direction.x);
    segment.rotation.z = 0; // Match bike tilt
  
    RENDERER.scene.add(segment);
  
    aiBike.userData.trail.push({ mesh: segment, time: RENDERER.clock.getElapsedTime() });
    if (aiBike.userData.trail.length > aiBike.userData.tailLength) {
      const oldest = aiBike.userData.trail.shift();
      RENDERER.scene.remove(oldest.mesh);
    }
  }
  
  function evaluateDirection(aiBike, direction) {
    const lookaheadDistance = 30 * aiBike.userData.characteristics.avoidDistance / AI.knowledgeBase.avoidDistance;
    const futurePosition = aiBike.position.clone().add(direction.clone().multiplyScalar(lookaheadDistance));
    let score = 100 * aiBike.userData.characteristics.riskTolerance;
  
    // Store distances for learning
    const distances = {
      walls: Infinity,
      obstacles: Infinity,
      playerTrail: Infinity,
      aiTrails: Infinity,
      closestPowerup: Infinity
    };
  
    // Penalty for nearing boundaries
    const distToBoundaryX = CONFIG.WORLD_SIZE / 2 - Math.abs(futurePosition.x);
    const distToBoundaryZ = CONFIG.WORLD_SIZE / 2 - Math.abs(futurePosition.z);
    const distToBoundary = Math.min(distToBoundaryX, distToBoundaryZ);
    distances.walls = distToBoundary;
  
    if (distToBoundary < 20) {
      score -= (1000 * AI.knowledgeBase.avoidWallWeight * (20 - distToBoundary) / 20);
    }
  
    // Obstacle collisions - updated for variable sizes
    for (let obstacle of obstacles) {
      // Get size multiplier from obstacle, default to 1 if not present
      const sizeMultiplier = obstacle.userData && obstacle.userData.sizeMultiplier ?
        obstacle.userData.sizeMultiplier : 1;
  
      const distance = futurePosition.distanceTo(obstacle.position);
      distances.obstacles = Math.min(distances.obstacles, distance);
  
      // Adjust collision threshold based on obstacle size
      const collisionThreshold = 15 * aiBike.userData.characteristics.riskTolerance * sizeMultiplier;
  
      // Higher generation AIs are better at avoiding larger obstacles
      const sizeAwareness = 1 + ((aiBike.userData.generation - 1) * 0.1);
  
      if (distance < collisionThreshold) {
        // Penalty increases with obstacle size and decreases with generation
        const sizePenalty = sizeMultiplier * 500 / sizeAwareness;
        score -= sizePenalty * (collisionThreshold - distance) / collisionThreshold;
      }
    }
  
    // Player trail
    for (let segment of PLAYER.trail) {
      const distance = futurePosition.distanceTo(segment.mesh.position);
      distances.playerTrail = Math.min(distances.playerTrail, distance);
      if (distance < 10) score -= 400;
    }
  
    // All AI trails including own trail
    for (let otherAI of AI.bikes) {
      for (let i = 0; i < otherAI.userData.trail.length; i++) {
        // Skip the most recent segments of own trail
        if (otherAI === aiBike && i >= otherAI.userData.trail.length - 3) continue;
  
        const segment = otherAI.userData.trail[i];
        const distance = futurePosition.distanceTo(segment.mesh.position);
        distances.aiTrails = Math.min(distances.aiTrails, distance);
  
        if (distance < 10) {
          // Avoiding own trail is more important than other AI trails
          const weight = (otherAI === aiBike) ? 1.2 : 0.8;
          score -= 400 * weight;
        }
      }
    }
  
    // Seek powerups
    for (let powerup of POWERUPS.items) {
      const distance = futurePosition.distanceTo(powerup.position);
      distances.closestPowerup = Math.min(distances.closestPowerup, distance);
  
      if (distance < 50) {
        // Higher generation AIs are better at valuing powerups
        const powerupWeight = aiBike.userData.characteristics.powerupWeight *
          (1 + (aiBike.userData.generation - 1) * 0.1);
        score += powerupWeight * (1 - distance / 50);
      }
    }
  
    // Move toward player (more aggressive at higher generations)
    if (aiBike.userData.generation > 2) {
      const distToPlayer = futurePosition.distanceTo(PLAYER.bike.position);
      // Target the player but not too close (to avoid collision with player trail)
      const optimalDistance = 50;
      const targetScore = 30 * (aiBike.userData.generation - 2);
  
      if (distToPlayer > optimalDistance) {
        // Move closer to player
        score += targetScore * (1 - Math.min(1, (distToPlayer - optimalDistance) / 100));
      } else if (distToPlayer < 20) {
        // Too close to player, back off a bit to avoid collision
        score -= 100 * (1 - distToPlayer / 20);
      }
    }
  
    // Add some randomness to encourage exploration
    score += (Math.random() - 0.5) * 20 * aiBike.userData.characteristics.turnRandomness;
  
    // Bias toward preferred turn direction
    if (aiBike.userData.characteristics.preferredTurn === 'left' &&
      direction.equals(new THREE.Vector3(-aiBike.userData.direction.z, 0, aiBike.userData.direction.x))) {
      score += 10;
    } else if (aiBike.userData.characteristics.preferredTurn === 'right' &&
      direction.equals(new THREE.Vector3(aiBike.userData.direction.z, 0, -aiBike.userData.direction.x))) {
      score += 10;
    }
  
    return { score, distances };
  }
  
  function updateAIDirection(aiBike) {
    const now = RENDERER.clock.getElapsedTime();
    if (now < aiBike.userData.lastTurnTime + (0.5 / aiBike.userData.speed)) return;
  
    // Make decisions more frequently as generations increase
    const decisionRate = 0.5 - Math.min(0.3, (aiBike.userData.generation - 1) * 0.05);
    aiBike.userData.lastTurnTime = now + Math.random() * decisionRate;
  
    const forward = aiBike.userData.direction.clone();
    const left = new THREE.Vector3(-aiBike.userData.direction.z, 0, aiBike.userData.direction.x);
    const right = new THREE.Vector3(aiBike.userData.direction.z, 0, -aiBike.userData.direction.x);
  
    const evaluations = {
      forward: evaluateDirection(aiBike, forward),
      left: evaluateDirection(aiBike, left),
      right: evaluateDirection(aiBike, right)
    };
  
    let bestDirection = 'forward';
    if (evaluations.left.score > evaluations.forward.score &&
      evaluations.left.score > evaluations.right.score) {
      bestDirection = 'left';
    } else if (evaluations.right.score > evaluations.forward.score &&
      evaluations.right.score > evaluations.left.score) {
      bestDirection = 'right';
    }
  
    // Learn from this decision
    learnFromDecision(aiBike, evaluations, bestDirection);
  
    if (bestDirection === 'left') {
      aiBike.userData.direction.set(-aiBike.userData.direction.z, 0, aiBike.userData.direction.x);
    } else if (bestDirection === 'right') {
      aiBike.userData.direction.set(aiBike.userData.direction.z, 0, -aiBike.userData.direction.x);
    }
  }
  
  function updateAIMovement() {
    for (let i = AI.bikes.length - 1; i >= 0; i--) {
      const aiBike = AI.bikes[i];
  
      updateAIDirection(aiBike);
  
      const aiMoveStep = aiBike.userData.direction.clone().multiplyScalar(aiBike.userData.speed);
      aiBike.position.add(aiMoveStep);
      const aiAngle = Math.atan2(aiBike.userData.direction.z, aiBike.userData.direction.x);
      aiBike.rotation.y = -aiAngle;
  
      if (
        aiBike.userData.trail.length === 0 ||
        aiBike.position.distanceTo(aiBike.userData.trail[aiBike.userData.trail.length - 1].mesh.position) > 3
      ) {
        addAITrail(aiBike);
      }
    }
  }
  
  /* ------------------ AI LEARNING ------------------ */
  function learnFromDecision(aiBike, evaluations, chosenDirection) {
    // Record the current position and direction for later learning
    aiBike.userData.lastPosition = aiBike.position.clone();
    aiBike.userData.lastEvaluation = evaluations[chosenDirection];
  }
  
  function learnFromSuccess(aiBike) {
    // AI collected a powerup, reinforce behavior
    aiBike.userData.powerupsCollected++;
  
    // Adjust characteristics based on success
    if (aiBike.userData.lastEvaluation) {
      // If it was close to a powerup and got it, increase powerup weight
      const lr = AI.knowledgeBase.learningRate;
      aiBike.userData.characteristics.powerupWeight += lr * 5;
  
      // Update shared knowledge base
      AI.knowledgeBase.powerupWeight = (AI.knowledgeBase.powerupWeight * (AI.generation - 1) +
        aiBike.userData.characteristics.powerupWeight) / AI.generation;
    }
  }
  
  function learnFromCrash(aiBike, causeOfCrash) {
    aiBike.userData.crashCount++;
  
    // Learn from this crash
    const lr = AI.knowledgeBase.learningRate;
  
    if (aiBike.userData.lastEvaluation) {
      if (causeOfCrash === 'wall') {
        // Crashed into wall, increase wall avoidance
        aiBike.userData.characteristics.avoidDistance += lr * 5;
        AI.knowledgeBase.avoidWallWeight += lr;
      } else if (causeOfCrash === 'obstacle' || causeOfCrash === 'trail') {
        // Crashed into obstacle or trail, increase avoid distance
        aiBike.userData.characteristics.avoidDistance += lr * 3;
      }
  
      // Decrease randomness for more predictability
      aiBike.userData.characteristics.turnRandomness -= lr * 0.05;
      aiBike.userData.characteristics.turnRandomness = Math.max(0.05, aiBike.userData.characteristics.turnRandomness);
  
      // Update global knowledge base
      AI.knowledgeBase.avoidDistance = (AI.knowledgeBase.avoidDistance * (AI.generation - 1) +
        aiBike.userData.characteristics.avoidDistance) / AI.generation;
    }
  
    // Respawn AI
    respawnAI(aiBike);
  }
  
  function respawnAI(aiBike) {
    // Clear trail
    for (let segment of aiBike.userData.trail) {
      RENDERER.scene.remove(segment.mesh);
    }
    aiBike.userData.trail = [];
  
    // Randomize new position
    const randomX = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 100);
    const randomZ = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 100);
    aiBike.position.set(randomX, 2, randomZ);
  
    // Random new direction
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const randomAngle = angles[Math.floor(Math.random() * angles.length)];
    aiBike.userData.direction.set(Math.cos(randomAngle), 0, Math.sin(randomAngle));
  
    // Reset tail length
    aiBike.userData.tailLength = 5;

    // Force an immediate update of the collision boxes for this AI
  if (window.COLLISIONS) {
    // This will update the spatial grid on the next frame
    // but we need to make sure the AI is properly tracked
    aiBike.userData.justRespawned = true;
  }
  }
  
  function startAISpawnTimer() {
    AI.timer = 0;
    if (AI.spawnInterval) clearInterval(AI.spawnInterval);
  
    AI.spawnInterval = setInterval(() => {
      if (CONFIG.STATE.isGameOver || CONFIG.STATE.isPaused || !CONFIG.STATE.gameStarted) return;
  
      AI.timer++;
      if (AI.timer >= 10) { // Spawn a new AI every 10 seconds
        AI.timer = 0;
        AI.generation++;
        createAIBike();
        updateAICounter();
      }
    }, 1000);
  }
  
  function updateAICounter() {
    document.getElementById('aiCount').textContent = AI.bikes.length;
  }
  
  function resetAI() {
    // Clean up all AI bikes
    for (let aiBike of AI.bikes) {
      RENDERER.scene.remove(aiBike);
      aiBike.userData.trail.forEach(segment => RENDERER.scene.remove(segment.mesh));
    }
    
    // Reset variables
    AI.bikes = [];
    AI.generation = 1;
    
    // Create initial AI
    createAIBike();
    
    // Update counter
    updateAICounter();
  }
  
  // Export AI functions
  AI.createAIBike = createAIBike;
  AI.updateAIMovement = updateAIMovement;
  AI.learnFromSuccess = learnFromSuccess;
  AI.startAISpawnTimer = startAISpawnTimer;
  AI.resetAI = resetAI;