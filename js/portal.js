/* ------------------ PORTAL SYSTEM ------------------ */

// Portal variables
const PORTAL = {
    startPortalBox: null,
    exitPortalBox: null,
    metaversePortalBox: null,
    exitPortalParticles: null,
    startPortalParticles: null,
    metaversePortalParticles: null
  };
  
  function setupPortals() {
    // Only create start portal if portal parameter is in URL
    if (new URLSearchParams(window.location.search).get('portal')) {
      createStartPortal();
    }
  
    // Create exit portal (always present)
    createExitPortal();
    
    // Create metaverse portal
    createMetaversePortal();
  }
  
  function createStartPortal() {
    // Create start portal
    const startPortalGroup = new THREE.Group();
    startPortalGroup.position.set(CONFIG.SPAWN_POINT_X, CONFIG.SPAWN_POINT_Y, CONFIG.SPAWN_POINT_Z);
    startPortalGroup.rotation.x = 0.35;
    startPortalGroup.rotation.y = 0;
  
    // Portal components
    const startPortalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
    const startPortalMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    const startPortal = new THREE.Mesh(startPortalGeometry, startPortalMaterial);
    startPortalGroup.add(startPortal);
  
    const startPortalInnerGeometry = new THREE.CircleGeometry(13, 32);
    const startPortalInnerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const startPortalInner = new THREE.Mesh(startPortalInnerGeometry, startPortalInnerMaterial);
    startPortalGroup.add(startPortalInner);
  
    // Create particle system for portal effect
    const startPortalParticleCount = 500;
    PORTAL.startPortalParticles = new THREE.BufferGeometry();
    const startPortalPositions = new Float32Array(startPortalParticleCount * 3);
    const startPortalColors = new Float32Array(startPortalParticleCount * 3);
  
    for (let i = 0; i < startPortalParticleCount * 3; i += 3) {
      // Create particles in a ring around the portal
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + (Math.random() - 0.5) * 4;
      startPortalPositions[i] = Math.cos(angle) * radius;
      startPortalPositions[i + 1] = Math.sin(angle) * radius;
      startPortalPositions[i + 2] = (Math.random() - 0.5) * 4;
  
      // Red color with slight variation
      startPortalColors[i] = 0.8 + Math.random() * 0.2;
      startPortalColors[i + 1] = 0;
      startPortalColors[i + 2] = 0;
    }
  
    PORTAL.startPortalParticles.setAttribute('position', new THREE.BufferAttribute(startPortalPositions, 3));
    PORTAL.startPortalParticles.setAttribute('color', new THREE.BufferAttribute(startPortalColors, 3));
  
    const startPortalParticleMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
  
    const startPortalParticleSystem = new THREE.Points(PORTAL.startPortalParticles, startPortalParticleMaterial);
    startPortalGroup.add(startPortalParticleSystem);
  
    RENDERER.scene.add(startPortalGroup);
    PORTAL.startPortalBox = new THREE.Box3().setFromObject(startPortalGroup);
  }
  
  function createExitPortal() {
    const exitPortalGroup = new THREE.Group();
    exitPortalGroup.position.set(CONFIG.WORLD_SIZE / 2 - 30, CONFIG.SPAWN_POINT_Y, -CONFIG.WORLD_SIZE / 2 + 30);
    exitPortalGroup.rotation.x = 0;
    exitPortalGroup.rotation.y = 0;
  
    // Create portal effect with same structure as start portal but green
    const exitPortalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
    const exitPortalMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });
    const exitPortal = new THREE.Mesh(exitPortalGeometry, exitPortalMaterial);
    exitPortalGroup.add(exitPortal);
  
    const exitPortalInnerGeometry = new THREE.CircleGeometry(13, 32);
    const exitPortalInnerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const exitPortalInner = new THREE.Mesh(exitPortalInnerGeometry, exitPortalInnerMaterial);
    exitPortalGroup.add(exitPortalInner);
  
    // Add portal label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 64;
    context.fillStyle = '#00ff00';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText('VIBEVERSE PORTAL', canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(30, 5);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.y = 20;
    exitPortalGroup.add(label);
  
    // Create particle system for portal effect
    const exitPortalParticleCount = 500;
    PORTAL.exitPortalParticles = new THREE.BufferGeometry();
    const exitPortalPositions = new Float32Array(exitPortalParticleCount * 3);
    const exitPortalColors = new Float32Array(exitPortalParticleCount * 3);
  
    for (let i = 0; i < exitPortalParticleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + (Math.random() - 0.5) * 4;
      exitPortalPositions[i] = Math.cos(angle) * radius;
      exitPortalPositions[i + 1] = Math.sin(angle) * radius;
      exitPortalPositions[i + 2] = (Math.random() - 0.5) * 4;
  
      // Green color with slight variation
      exitPortalColors[i] = 0;
      exitPortalColors[i + 1] = 0.8 + Math.random() * 0.2;
      exitPortalColors[i + 2] = 0;
    }
  
    PORTAL.exitPortalParticles.setAttribute('position', new THREE.BufferAttribute(exitPortalPositions, 3));
    PORTAL.exitPortalParticles.setAttribute('color', new THREE.BufferAttribute(exitPortalColors, 3));
  
    const exitPortalParticleMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
  
    const exitPortalParticleSystem = new THREE.Points(PORTAL.exitPortalParticles, exitPortalParticleMaterial);
    exitPortalGroup.add(exitPortalParticleSystem);
  
    RENDERER.scene.add(exitPortalGroup);
    PORTAL.exitPortalBox = new THREE.Box3().setFromObject(exitPortalGroup);
  }
  
  function createMetaversePortal() {
    const metaversePortalGroup = new THREE.Group();
    metaversePortalGroup.position.set(-CONFIG.WORLD_SIZE / 2 + 30, CONFIG.SPAWN_POINT_Y, -CONFIG.WORLD_SIZE / 2 + 30);
    metaversePortalGroup.rotation.x = 0;
    metaversePortalGroup.rotation.y = 0;
  
    // Create portal effect with Facebook blue color (#1877F2)
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
  
    // METAVERSE label
    const metaverseCanvas = document.createElement('canvas');
    const metaverseContext = metaverseCanvas.getContext('2d');
    metaverseCanvas.width = 512;
    metaverseCanvas.height = 64;
    metaverseContext.fillStyle = '#1877F2';
    metaverseContext.font = 'bold 32px Arial';
    metaverseContext.textAlign = 'center';
    metaverseContext.fillText('METAVERSE', metaverseCanvas.width / 2, metaverseCanvas.height / 2);
    const metaverseTexture = new THREE.CanvasTexture(metaverseCanvas);
    const metaverseLabelGeometry = new THREE.PlaneGeometry(25, 5);
    const metaverseLabelMaterial = new THREE.MeshBasicMaterial({
      map: metaverseTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const metaverseLabel = new THREE.Mesh(metaverseLabelGeometry, metaverseLabelMaterial);
    metaverseLabel.position.y = 20;
    metaversePortalGroup.add(metaverseLabel);
  
    // Create particle system for portal effect
    const metaversePortalParticleCount = 500;
    PORTAL.metaversePortalParticles = new THREE.BufferGeometry();
    const metaversePortalPositions = new Float32Array(metaversePortalParticleCount * 3);
    const metaversePortalColors = new Float32Array(metaversePortalParticleCount * 3);
  
    for (let i = 0; i < metaversePortalParticleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + (Math.random() - 0.5) * 4;
      metaversePortalPositions[i] = Math.cos(angle) * radius;
      metaversePortalPositions[i + 1] = Math.sin(angle) * radius;
      metaversePortalPositions[i + 2] = (Math.random() - 0.5) * 4;
  
      // Facebook blue color with slight variation
      metaversePortalColors[i] = 0.09;                     // Red component (24/255)
      metaversePortalColors[i + 1] = 0.47;                 // Green component (119/255)
      metaversePortalColors[i + 2] = 0.95 + Math.random() * 0.05; // Blue component (242/255)
    }
  
    PORTAL.metaversePortalParticles.setAttribute('position', new THREE.BufferAttribute(metaversePortalPositions, 3));
    PORTAL.metaversePortalParticles.setAttribute('color', new THREE.BufferAttribute(metaversePortalColors, 3));
  
    const metaversePortalParticleMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
  
    const metaversePortalParticleSystem = new THREE.Points(PORTAL.metaversePortalParticles, metaversePortalParticleMaterial);
    metaversePortalGroup.add(metaversePortalParticleSystem);
  
    RENDERER.scene.add(metaversePortalGroup);
    PORTAL.metaversePortalBox = new THREE.Box3().setFromObject(metaversePortalGroup);
  }
  
  function updatePortals(delta, elapsedTime) {
    // Update start portal particles if they exist
    if (PORTAL.startPortalParticles && PORTAL.startPortalParticles.attributes && PORTAL.startPortalParticles.attributes.position) {
      const positions = PORTAL.startPortalParticles.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.05 * Math.sin(elapsedTime + i);
      }
      PORTAL.startPortalParticles.attributes.position.needsUpdate = true;
    }
  
    // Update exit portal particles
    if (PORTAL.exitPortalParticles && PORTAL.exitPortalParticles.attributes && PORTAL.exitPortalParticles.attributes.position) {
      const positions = PORTAL.exitPortalParticles.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.05 * Math.sin(elapsedTime + i);
      }
      PORTAL.exitPortalParticles.attributes.position.needsUpdate = true;
    }
  
    // Check for start portal collision if it exists
    if (new URLSearchParams(window.location.search).get('portal') && PORTAL.startPortalBox) {
      const playerBox = new THREE.Box3().setFromObject(PLAYER.bike);
      const portalDistance = playerBox.getCenter(new THREE.Vector3()).distanceTo(PORTAL.startPortalBox.getCenter(new THREE.Vector3()));
  
      if (portalDistance < 50) {
        // Get ref from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const refUrl = urlParams.get('ref');
        if (refUrl) {
          // Add https if not present and include query params
          let url = refUrl;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          const currentParams = new URLSearchParams(window.location.search);
          const newParams = new URLSearchParams();
          for (const [key, value] of currentParams) {
            if (key !== 'ref') {
              newParams.append(key, value);
            }
          }
          const paramString = newParams.toString();
          window.location.href = url + (paramString ? '?' + paramString : '');
        }
      }
    }
  
    // Check for exit portal collision
    if (PORTAL.exitPortalBox) {
      const playerBox = new THREE.Box3().setFromObject(PLAYER.bike);
      const portalDistance = playerBox.getCenter(new THREE.Vector3()).distanceTo(PORTAL.exitPortalBox.getCenter(new THREE.Vector3()));
  
      if (portalDistance < 50) {
        // Start loading the next page in the background
        const currentParams = new URLSearchParams(window.location.search);
        const newParams = new URLSearchParams();
        newParams.append('portal', 'true');
  
        // Use player's progress as parameters
        newParams.append('score', PLAYER.score);
        newParams.append('color', RENDERER.effectsConfig.playerColor);
  
        for (const [key, value] of currentParams) {
          if (!['portal', 'score', 'color'].includes(key)) {
            newParams.append(key, value);
          }
        }
  
        const paramString = newParams.toString();
        const nextPage = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '');
  
        // Create hidden iframe to preload next page
        if (!document.getElementById('preloadFrame')) {
          const iframe = document.createElement('iframe');
          iframe.id = 'preloadFrame';
          iframe.style.display = 'none';
          iframe.src = nextPage;
          document.body.appendChild(iframe);
        }
  
        // Only redirect once actually in the portal (very close)
        if (portalDistance < 15) {
          window.location.href = nextPage;
        }
      }
    }
  
    // Update Metaverse portal particles
    if (PORTAL.metaversePortalParticles && PORTAL.metaversePortalParticles.attributes && PORTAL.metaversePortalParticles.attributes.position) {
      const positions = PORTAL.metaversePortalParticles.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.05 * Math.sin(elapsedTime + i);
      }
      PORTAL.metaversePortalParticles.attributes.position.needsUpdate = true;
    }
  
    // Check for Metaverse portal collision
    if (PORTAL.metaversePortalBox) {
      const playerBox = new THREE.Box3().setFromObject(PLAYER.bike);
      const portalDistance = playerBox.getCenter(new THREE.Vector3()).distanceTo(PORTAL.metaversePortalBox.getCenter(new THREE.Vector3()));
  
      if (portalDistance < 50) {
        // Only redirect once actually in the portal (very close)
        if (portalDistance < 15) {
          // Redirect to the metaverse URL
          window.location.href = "https://metaverse-delta.vercel.app/";
        }
      }
    }
  }