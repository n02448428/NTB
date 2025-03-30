/* ------------------ POWERUPS SYSTEM ------------------ */

// Powerups storage
const POWERUPS = {
    items: []
  };
  
  function createPowerup() {
    const geometry = new THREE.SphereGeometry(3, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.4)
    });
    const powerup = new THREE.Mesh(geometry, material);
  
    let validPosition = false;
    while (!validPosition) {
      const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
      const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
      let tooClose = false;
  
      for (let obs of obstacles) {
        // Get size multiplier from obstacle, default to 1 if not present
        const sizeMultiplier = obs.userData && obs.userData.sizeMultiplier ?
          obs.userData.sizeMultiplier : 1;
  
        // Scale minimum distance based on obstacle size
        const minDistance = 15 * sizeMultiplier;
  
        if (new THREE.Vector3(x, 0, z).distanceTo(obs.position) < minDistance) {
          tooClose = true;
          break;
        }
      }
  
      if (!tooClose) {
        powerup.position.set(x, 3, z);
        validPosition = true;
      }
    }
  
    // Add pulsing light to powerups
    const powerupLight = new THREE.PointLight(
      0xffffff,
      0.7 * (1 + RENDERER.effectsConfig.master),
      15 * (1 + RENDERER.effectsConfig.master)
    );
    powerupLight.position.copy(powerup.position);
    RENDERER.scene.add(powerupLight);
  
    powerup.userData = { light: powerupLight };
    RENDERER.scene.add(powerup);
    POWERUPS.items.push(powerup);
    
    return powerup;
  }
  
  function checkPowerups() {
    for (let i = POWERUPS.items.length - 1; i >= 0; i--) {
      const powerup = POWERUPS.items[i];
  
      // Player collects
      if (PLAYER.bike.position.distanceTo(powerup.position) < 5) {
        RENDERER.scene.remove(powerup);
        if (powerup.userData.light) RENDERER.scene.remove(powerup.userData.light);
        POWERUPS.items.splice(i, 1);
        PLAYER.tailLength += 5;
        PLAYER.score += 1;
        updateScore();
        setTimeout(createPowerup, 2000);
        continue;
      }
  
      // AI collects
      for (let aiBike of AI.bikes) {
        if (aiBike.position.distanceTo(powerup.position) < 5) {
          RENDERER.scene.remove(powerup);
          if (powerup.userData.light) RENDERER.scene.remove(powerup.userData.light);
          POWERUPS.items.splice(i, 1);
          aiBike.userData.tailLength += 5;
          learnFromSuccess(aiBike);
          setTimeout(createPowerup, 2000);
          break;
        }
      }
    }
  }
  
  function updatePowerupAnimations(elapsedTime) {
    // Animate powerups
    POWERUPS.items.forEach(powerup => {
      powerup.rotation.y += 0.02 * RENDERER.effectsConfig.speed;
  
      // Hover motion
      const hoverHeight = 3 + Math.sin(elapsedTime * 2 * RENDERER.effectsConfig.speed) * 0.5;
      powerup.position.y = hoverHeight;
  
      // Pulse the light
      if (powerup.userData.light) {
        const baseBrightness = 0.7 * (1 + RENDERER.effectsConfig.bloom * 0.2);
        const pulseFactor = Math.sin(elapsedTime * 3 * RENDERER.effectsConfig.speed) * 0.3;
        powerup.userData.light.intensity = baseBrightness + pulseFactor;
        powerup.userData.light.position.copy(powerup.position);
      }
    });
  }
  
  function initPowerups(count = 20) {
    // Clear any existing powerups
    for (let powerup of POWERUPS.items) {
      RENDERER.scene.remove(powerup);
      if (powerup.userData.light) RENDERER.scene.remove(powerup.userData.light);
    }
    POWERUPS.items = [];
    
    // Create new powerups
    for (let i = 0; i < count; i++) {
      createPowerup();
    }
  }