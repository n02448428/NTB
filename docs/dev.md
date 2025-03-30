# Neon Trailblazer Development Guide

This guide provides instructions for developers who want to extend or modify the Neon Trailblazer game. It covers common development tasks and best practices.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Code Organization](#code-organization)
- [Adding New Features](#adding-new-features)
  - [New Obstacles](#new-obstacles)
  - [New Powerups](#new-powerups)
  - [New Portal Types](#new-portal-types)
- [Modifying AI Behavior](#modifying-ai-behavior)
- [Creating Visual Effects](#creating-visual-effects)
- [Optimization Tips](#optimization-tips)
- [Testing](#testing)

## Development Environment Setup

### Required Tools
- Text editor or IDE (VS Code recommended)
- Modern web browser with developer tools
- Local web server (Python's built-in server, Node's http-server, etc.)
- Git for version control

### Setting Up VS Code
1. Install recommended extensions:
   - Live Server
   - ESLint
   - Three.js snippets
   - Shader languages support

2. Configure workspace settings (`.vscode/settings.json`):
   ```json
   {
     "editor.tabSize": 2,
     "editor.formatOnSave": true,
     "liveServer.settings.port": 5500,
     "liveServer.settings.root": "/"
   }
   ```

3. Launch with Live Server for automatic reloading

### Debugging Tips
- Use browser developer tools (F12) for debugging
- Log to console with meaningful labels: `console.log('AI Decision:', decision);`
- Use Chrome's Performance tab to identify bottlenecks
- Test on multiple devices for performance issues

## Code Organization

The codebase follows a modular structure with each file responsible for a specific aspect of the game:

```
/js
  /config.js          # Game constants and configuration
  /utils.js           # Utility functions
  /shaders.js         # Custom shader definitions
  /renderer.js        # Three.js setup and rendering
  /world.js           # Game environment
  /player.js          # Player bike and controls
  /aiSystem.js        # AI behavior and learning
  /collisions.js      # Collision detection
  /powerups.js        # Powerup system
  /portal.js          # Portal system
  /controls.js        # Input handling
  /ui.js              # User interface
  /effectsSystem.js   # Visual effects management
  /audio.js           # Sound management
  /leaderboard.js     # Leaderboard system
  /preview.js         # Splash screen preview
  /main.js            # Game initialization and loop
```

When adding new features, try to maintain this separation of concerns.

## Adding New Features

### New Obstacles

To add a new obstacle type:

1. Modify the `createObstacle()` function in `world.js`:

```javascript
// Add a new obstacle type to the types array
const types = [
  { geoType: "box", color: 0xff5500 },
  { geoType: "cylinder", color: 0x00ff88 },
  { geoType: "tetrahedron", color: 0xffff00 },
  { geoType: "YOUR_NEW_TYPE", color: 0xYOUR_COLOR } // Add your new type here
];

// Add a new case in the switch statement
switch (type.geoType) {
  // ... existing cases
  case "YOUR_NEW_TYPE":
    geometry = new THREE.YourGeometry(
      10 * sizeMultiplier,
      // other parameters as needed
    );
    break;
}
```

2. Update collision detection logic if needed:
   - If your new obstacle has a unique shape, you may need to adjust the collision detection in `checkPlayerCollisions()` and `checkAICollisions()`.
   - Custom collision boxes can be added with: `obstacle.userData.collisionBox = new THREE.Box3().setFromObject(obstacle);`

3. Consider adding visual effects specific to your new obstacle type

### New Powerups

To add a new powerup type:

1. Create a new function in `powerups.js` similar to `createPowerup()`:

```javascript
function createSpecialPowerup() {
  // Create a unique mesh for your powerup
  const geometry = new THREE.TorusGeometry(3, 1, 16, 16);
  const material = new THREE.MeshPhongMaterial({
    color: 0xff00ff,  // Choose a distinct color
    emissive: 0xff00ff,
    emissiveIntensity: 0.8 + (RENDERER.effectsConfig.master * 0.4)
  });
  const powerup = new THREE.Mesh(geometry, material);
  
  // Set a valid position (code similar to createPowerup)
  // ...

  // Add visual effects
  const powerupLight = new THREE.PointLight(
    0xff00ff,
    0.7 * (1 + RENDERER.effectsConfig.master),
    15 * (1 + RENDERER.effectsConfig.master)
  );
  powerupLight.position.copy(powerup.position);
  RENDERER.scene.add(powerupLight);

  // Mark this as a special powerup
  powerup.userData = { 
    light: powerupLight,
    type: 'special'
  };
  
  RENDERER.scene.add(powerup);
  POWERUPS.items.push(powerup);
  
  return powerup;
}
```

2. Modify `checkPowerups()` to handle your new powerup type:

```javascript
// In checkPowerups function
if (playerBike.position.distanceTo(powerup.position) < 5) {
  RENDERER.scene.remove(powerup);
  if (powerup.userData.light) RENDERER.scene.remove(powerup.userData.light);
  POWERUPS.items.splice(i, 1);
  
  // Apply different effects based on powerup type
  if (powerup.userData.type === 'special') {
    // Special powerup effect (speed boost, invincibility, etc.)
    applySpecialPowerupEffect();
  } else {
    // Regular powerup effect
    PLAYER.tailLength += 5;
    PLAYER.score += 1;
  }
  
  updateScore();
  setTimeout(createPowerup, 2000);
  continue;
}
```

3. Create a function to apply your special powerup effect:

```javascript
function applySpecialPowerupEffect() {
  // For example, a temporary speed boost
  const originalSpeed = CONFIG.PLAYER_SPEED;
  CONFIG.PLAYER_SPEED *= 2;
  
  // Show visual indicator
  UTILS.showToast('Speed Boost!');
  
  // Reset after a time delay
  setTimeout(() => {
    CONFIG.PLAYER_SPEED = originalSpeed;
    UTILS.showToast('Speed normal');
  }, 5000);
}
```

### New Portal Types

To add a new portal type:

1. Add a new creation function in `portal.js`:

```javascript
function createCustomPortal() {
  const portalGroup = new THREE.Group();
  portalGroup.position.set(x, y, z); // Choose coordinates
  
  // Create portal visuals
  const portalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
  const portalMaterial = new THREE.MeshPhongMaterial({
    color: 0xPORTAL_COLOR,
    emissive: 0xPORTAL_COLOR,
    transparent: true,
    opacity: 0.8
  });
  const portal = new THREE.Mesh(portalGeometry, portalMaterial);
  portalGroup.add(portal);
  
  // Add inner circle
  const innerGeometry = new THREE.CircleGeometry(13, 32);
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xPORTAL_COLOR,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const inner = new THREE.Mesh(innerGeometry, innerMaterial);
  portalGroup.add(inner);
  
  // Add label
  // ... (code for creating label)
  
  // Add particle effects
  // ... (code for particles)
  
  RENDERER.scene.add(portalGroup);
  
  // Store portal collision box
  PORTAL.customPortalBox = new THREE.Box3().setFromObject(portalGroup);
  
  return portalGroup;
}
```

2. Call this function from `setupPortals()`:

```javascript
function setupPortals() {
  // Existing portal creation
  // ...
  
  // Create your new portal
  createCustomPortal();
}
```

3. Add collision detection to `updatePortals()`:

```javascript
// Check for custom portal collision
if (PORTAL.customPortalBox) {
  const playerBox = new THREE.Box3().setFromObject(PLAYER.bike);
  const portalDistance = playerBox.getCenter(new THREE.Vector3()).distanceTo(
    PORTAL.customPortalBox.getCenter(new THREE.Vector3())
  );

  if (portalDistance < 15) {
    // Custom portal behavior
    customPortalEffect();
  }
}
```

4. Implement the portal effect:

```javascript
function customPortalEffect() {
  // Portal effect (teleport, power-up, level change, etc.)
  // For example, teleporting to a specific location:
  PLAYER.bike.position.set(x, y, z);
  
  // Maybe apply a special effect
  UTILS.showToast('Teleported!');
  
  // Or load another level/URL
  // window.location.href = "new-level.html";
}
```

## Modifying AI Behavior

The AI system uses a combination of rules and learning to make decisions. To modify AI behavior:

### Adjusting Base Parameters

1. Modify initial values in `config.js`:

```javascript
KNOWLEDGE_BASE: {
  avoidDistance: 25,    // How far AI looks ahead for obstacles
  powerupWeight: 50,    // How much AI values powerups
  turnRandomness: 0.2,  // Random factor in decisions
  avoidWallWeight: 1.0, // How much AI avoids walls
  learningRate: 0.1     // How quickly AI learns
}
```

### Modifying Decision Logic

1. The core decision-making occurs in `evaluateDirection()` in `aiSystem.js`
2. To add a new behavior factor, add it to the score calculation:

```javascript
// For example, to make AI avoid the center of the map:
const distanceToCenter = futurePosition.distanceTo(new THREE.Vector3(0, 0, 0));
if (distanceToCenter < 100) {
  // Penalize being close to center
  score -= (100 - distanceToCenter) * 0.5;
}
```

### Adding New Learning Parameters

1. Add the parameter to the AI's characteristics in `createAIBike()`:

```javascript
characteristics: {
  // Existing characteristics
  newParameter: 0.5 + Math.random() * 1.0, // Initial value with randomness
}
```

2. Integrate it into the decision-making process in `evaluateDirection()`
3. Update the learning system in `learnFromSuccess()` and `learnFromCrash()`

```javascript
// In learnFromSuccess:
if (someCondition) {
  aiBike.userData.characteristics.newParameter += lr * 2;
  
  // Update shared knowledge
  AI.knowledgeBase.newParameter = (AI.knowledgeBase.newParameter * (AI.generation - 1) +
    aiBike.userData.characteristics.newParameter) / AI.generation;
}
```

## Creating Visual Effects

The game uses custom shaders for visual effects. To add a new visual effect:

1. Create a new shader in `shaders.js`:

```javascript
const NewEffectShader = {
  uniforms: {
    tDiffuse: { value: null },    // Required for post-processing
    time: { value: 0.0 },         // For animated effects
    intensity: { value: 1.0 }     // Effect strength
    // Add other parameters as needed
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    varying vec2 vUv;
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Your effect implementation here
      // For example, a simple vignette:
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      color.rgb *= 1.0 - (dist * intensity);
      
      gl_FragColor = color;
    }
  `
};
```

2. Add the effect to the config in `config.js`:

```javascript
EFFECTS_CONFIG: {
  // Existing effects
  newEffect: 1.0  // Default intensity
}
```

3. Create a new shader pass in `renderer.js`:

```javascript
// In setupPostProcessing function
const newEffectPass = new THREE.ShaderPass(NewEffectShader);
newEffectPass.uniforms.intensity.value = effectsConfig.newEffect;
composer.addPass(newEffectPass);
effectPasses.newEffect = newEffectPass;
```

4. Add the effect to `updateEffects()`:

```javascript
if (effectPasses.newEffect && effectPasses.newEffect.uniforms) {
  effectPasses.newEffect.uniforms.intensity.value = 
    effectsConfig.newEffect * effectsConfig.master;
}
```

5. Add UI controls in `setupEffectsPanel()`:

```javascript
// Add HTML for the control
const html = `
  <div class="effect-control">
    <label>New Effect:</label>
    <input type="range" id="newEffectIntensity" min="0" max="10" step="0.1" value="1">
    <input type="number" id="newEffectNumber" min="0" max="10" step="0.1" value="1">
  </div>
`;

// Add the control to the panel

// Setup the control event handlers
setupControl('newEffectIntensity', 'newEffectNumber', 'newEffect');
```

## Optimization Tips

### Performance Optimization

1. **Limit Object Count**
   - Remove old trail segments that are far from the player
   - Use object pooling for frequently created/destroyed objects

2. **Optimize Rendering**
   - Use `THREE.BufferGeometry` instead of `THREE.Geometry`
   - Share materials when possible
   - Disable effects on low-performance devices

3. **Collision Detection**
   - Use simplified collision shapes for complex objects
   - Implement spatial partitioning for many objects
   - Skip collision checks for distant objects

### Example: Optimizing Trail Segments

```javascript
// Instead of keeping all trail segments forever, remove distant ones
function pruneDistantTrailSegments() {
  const maxDistance = 200; // Only keep segments within this distance
  const playerPos = PLAYER.bike.position;
  
  // Player trail
  for (let i = PLAYER.trail.length - 1; i >= 0; i--) {
    if (playerPos.distanceTo(PLAYER.trail[i].mesh.position) > maxDistance) {
      RENDERER.scene.remove(PLAYER.trail[i].mesh);
      PLAYER.trail.splice(i, 1);
    }
  }
  
  // AI trails (similar approach)
}

// Call this periodically
setInterval(pruneDistantTrailSegments, 5000);
```

## Testing

### Performance Testing

1. Test on various devices with different capabilities
2. Monitor FPS counter while playing
3. Use Chrome DevTools Performance tab to identify bottlenecks

### Compatibility Testing

1. Test in different browsers (Chrome, Firefox, Safari, Edge)
2. Test on different mobile devices and screen sizes
3. Verify touch controls work correctly on all touch devices

### Game Balance Testing

1. Test AI difficulty with different parameters
2. Ensure powerups are balanced and don't make the game too easy
3. Check that the game progression feels fair and engaging

## Conclusion

This development guide should help you extend and modify the Neon Trailblazer game. Remember to maintain the modular structure and document any significant changes you make to help future developers.

When creating new features, consider both the technical implementation and how it affects gameplay. The best additions enhance the player experience while maintaining the game's visual style and performance.