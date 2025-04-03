/* ------------------ COLLISION DETECTION SYSTEM WITH GHOST WIREFRAMES ------------------ */

// Cache for collision shapes to improve performance
const collisionBoxes = {
    player: null,
    ais: [],
    obstacles: [],
    powerups: [],
    portals: {}
  };
  
  // Store the previous game's obstacle wireframes
  let previousGameWireframes = [];
  
  // Collision detection constants
  const COLLISION = {
    PLAYER_SIZE: { width: 4, height: 6, depth: 1 },
    AI_SIZE: { width: 4, height: 6, depth: 1 },
    TRAIL_SIZE: { width: 2, height: 6, depth: 1 },
    POWERUP_RADIUS: 4,
    BOUNDARY_MARGIN: 5,
    MIN_OBSTACLE_DISTANCE: 8,
    TRAIL_SEGMENTS_TO_IGNORE: 5,
    SPATIAL_HASH_CELL_SIZE: 20,
    COLLISION_PADDING: 0.1,
    CYLINDER_MARGIN: 0.9,
    TETRAHEDRON_MARGIN: 0.85,
    GHOST_WIREFRAME_OPACITY: 0.25  // Lower opacity for the ghost effect
  };
  
  // Spatial partitioning for faster collision checks
  const spatialGrid = {
    cells: {},
    
    // Add object to grid
    addObject: function(object, objectType, id) {
      if (!object || !object.position) return;
      
      const cellKey = this.getCellKey(object.position);
      
      if (!this.cells[cellKey]) {
        this.cells[cellKey] = {
          players: [],
          ais: [],
          trails: [],
          obstacles: [],
          powerups: []
        };
      }
      
      if (this.cells[cellKey][objectType]) {
        this.cells[cellKey][objectType].push({ object, id });
      }
    },
    
    // Clear the grid
    clear: function() {
      this.cells = {};
    },
    
    // Get cell key from position
    getCellKey: function(position) {
      const x = Math.floor(position.x / COLLISION.SPATIAL_HASH_CELL_SIZE);
      const z = Math.floor(position.z / COLLISION.SPATIAL_HASH_CELL_SIZE);
      return `${x},${z}`;
    },
    
    // Get all objects in neighboring cells
    getNeighborObjects: function(position, objectType) {
      if (!position) return [];
      
      const cellX = Math.floor(position.x / COLLISION.SPATIAL_HASH_CELL_SIZE);
      const cellZ = Math.floor(position.z / COLLISION.SPATIAL_HASH_CELL_SIZE);
      const objects = [];
      
      // Check current cell and 8 neighboring cells
      for (let x = cellX - 1; x <= cellX + 1; x++) {
        for (let z = cellZ - 1; z <= cellZ + 1; z++) {
          const key = `${x},${z}`;
          if (this.cells[key] && this.cells[key][objectType]) {
            objects.push(...this.cells[key][objectType]);
          }
        }
      }
      
      return objects;
    }
  };
  
  // Helper function to create a THREE.Box3 from position and size
  function createBox3FromPositionAndSize(position, size) {
    const halfWidth = size.width / 2 + COLLISION.COLLISION_PADDING;
    const halfHeight = size.height / 2 + COLLISION.COLLISION_PADDING;
    const halfDepth = size.depth / 2 + COLLISION.COLLISION_PADDING;
    
    return new THREE.Box3(
      new THREE.Vector3(
        position.x - halfWidth,
        position.y - halfHeight,
        position.z - halfDepth
      ),
      new THREE.Vector3(
        position.x + halfWidth,
        position.y + halfHeight,
        position.z + halfDepth
      )
    );
  }
  
  // Helper functions to check geometry types
  function isBoxGeometry(geometry) {
    return geometry && (
      geometry.type === 'BoxGeometry' ||
      geometry.type === 'BoxBufferGeometry'
    );
  }
  
  function isCylinderGeometry(geometry) {
    return geometry && (
      geometry.type === 'CylinderGeometry' ||
      geometry.type === 'CylinderBufferGeometry'
    );
  }
  
  function isTetrahedronGeometry(geometry) {
    return geometry && (
      geometry.type === 'TetrahedronGeometry' ||
      geometry.type === 'TetrahedronBufferGeometry'
    );
  }
  
  // Create appropriate collision shape for an obstacle
  function createObstacleCollisionShape(obstacle) {
    if (!obstacle || !obstacle.geometry) {
      return { type: 'sphere', radius: 5 };
    }
    
    const sizeMultiplier = obstacle.userData?.sizeMultiplier || 1;
    
    try {
      if (isBoxGeometry(obstacle.geometry)) {
        const params = obstacle.geometry.parameters;
        if (params) {
          return {
            type: 'box',
            size: {
              width: params.width,
              height: params.height,
              depth: params.depth
            }
          };
        }
      } 
      else if (isCylinderGeometry(obstacle.geometry)) {
        const params = obstacle.geometry.parameters;
        if (params) {
          const topRadius = params.radiusTop;
          const bottomRadius = params.radiusBottom;
          const height = params.height;
          
          return {
            type: 'cylinder',
            radiusTop: topRadius * COLLISION.CYLINDER_MARGIN,
            radiusBottom: bottomRadius * COLLISION.CYLINDER_MARGIN,
            height: height,
            radialSegments: params.radialSegments
          };
        }
      }
      else if (isTetrahedronGeometry(obstacle.geometry)) {
        const params = obstacle.geometry.parameters;
        if (params) {
          return {
            type: 'tetrahedron',
            radius: params.radius * COLLISION.TETRAHEDRON_MARGIN,
            vertices: obstacle.geometry.vertices || []
          };
        }
      }
    } catch (e) {
      console.error("Error calculating obstacle shape:", e);
    }
    
    return { 
      type: 'sphere', 
      radius: COLLISION.MIN_OBSTACLE_DISTANCE * sizeMultiplier 
    };
  }
  
  // Initialize collision boxes and spatial grid for static objects
  function initCollisionBoxes() {
    collisionBoxes.obstacles = [];
    
    // Remove all current wireframes at the start of each new game
    removeCurrentWireframes();
    
    // Create collision boxes for obstacles
    obstacles.forEach((obstacle, index) => {
      if (!obstacle || !obstacle.position) return;
      
      try {
        const collisionShape = createObstacleCollisionShape(obstacle);
        
        collisionBoxes.obstacles[index] = {
          position: obstacle.position.clone(),
          rotation: obstacle.rotation ? obstacle.rotation.clone() : new THREE.Euler(),
          shape: collisionShape,
          object: obstacle,
          sizeMultiplier: obstacle.userData?.sizeMultiplier || 1
        };
      } catch (e) {
        console.error("Error creating collision box for obstacle", index, e);
      }
    });
    
    // Create collision boxes for portals
    if (PORTAL.startPortalBox) {
      collisionBoxes.portals.start = {
        box: PORTAL.startPortalBox,
        type: 'start'
      };
    }
    
    if (PORTAL.exitPortalBox) {
      collisionBoxes.portals.exit = {
        box: PORTAL.exitPortalBox,
        type: 'exit'
      };
    }
    
    if (PORTAL.metaversePortalBox) {
      collisionBoxes.portals.metaverse = {
        box: PORTAL.metaversePortalBox,
        type: 'metaverse'
      };
    }
    
    // Show the previous game's obstacle wireframes
    showPreviousGameWireframes();
  }
  
  // Update dynamic collision boxes (called every frame)
  function updateDynamicCollisionBoxes() {
    spatialGrid.clear();
    
    // Add static obstacles to grid
    collisionBoxes.obstacles.forEach((obstacleBox, index) => {
      if (obstacleBox && obstacleBox.object) {
        spatialGrid.addObject(obstacleBox.object, 'obstacles', index);
      }
    });
    
    // Update player collision box
    if (PLAYER && PLAYER.bike) {
      collisionBoxes.player = {
        position: PLAYER.bike.position.clone(),
        rotation: PLAYER.bike.rotation.y,
        size: COLLISION.PLAYER_SIZE
      };
      
      spatialGrid.addObject(PLAYER.bike, 'players', 'player');
      
      // Add player trail to spatial grid
      PLAYER.trail.forEach((segment, index) => {
        if (segment && segment.mesh) {
          spatialGrid.addObject(segment.mesh, 'trails', `player_${index}`);
        }
      });
    }
    
    // Update AI collision boxes
    collisionBoxes.ais = [];
    AI.bikes.forEach((aiBike, index) => {
      if (!aiBike || !aiBike.position) return;
      
      collisionBoxes.ais[index] = {
        position: aiBike.position.clone(),
        rotation: aiBike.rotation.y,
        size: COLLISION.AI_SIZE,
        bike: aiBike
      };
      
      spatialGrid.addObject(aiBike, 'ais', index);
      
      // Add AI trail to spatial grid
      if (aiBike.userData && aiBike.userData.trail) {
        aiBike.userData.trail.forEach((segment, segmentIndex) => {
          if (segment && segment.mesh) {
            spatialGrid.addObject(segment.mesh, 'trails', `ai_${index}_${segmentIndex}`);
          }
        });
      }
    });
    
    // Update powerup collision boxes
    collisionBoxes.powerups = [];
    POWERUPS.items.forEach((powerup, index) => {
      if (!powerup || !powerup.position) return;
      
      collisionBoxes.powerups[index] = {
        position: powerup.position.clone(),
        radius: COLLISION.POWERUP_RADIUS,
        powerup: powerup
      };
      
      spatialGrid.addObject(powerup, 'powerups', index);
    });
  }
  
  // Check for collision between two oriented boxes
  function checkOrientedBoxCollision(box1, box2) {
    const box1Size = box1.size || COLLISION.PLAYER_SIZE;
    const box2Size = box2.size || COLLISION.PLAYER_SIZE;
    
    const box1AABB = createBox3FromPositionAndSize(box1.position, box1Size);
    const box2AABB = createBox3FromPositionAndSize(box2.position, box2Size);
    
    return box1AABB.intersectsBox(box2AABB);
  }
  
  // Check for collision between a box and a sphere
  function checkBoxSphereCollision(box, sphere) {
    const boxSize = box.size || COLLISION.PLAYER_SIZE;
    const boxAABB = createBox3FromPositionAndSize(box.position, boxSize);
    
    const closestPoint = new THREE.Vector3();
    closestPoint.copy(sphere.position);
    boxAABB.clampPoint(closestPoint, closestPoint);
    
    const distance = closestPoint.distanceTo(sphere.position);
    return distance < sphere.radius;
  }
  
  // Precise cylinder collision detection
  function checkBoxCylinderCollision(box, cylinder) {
    const boxSize = box.size || COLLISION.PLAYER_SIZE;
    const boxAABB = createBox3FromPositionAndSize(box.position, boxSize);
    
    const boxMin = boxAABB.min;
    const boxMax = boxAABB.max;
    
    // 1. Check vertical overlap with cylinder height
    const cylinderBottom = cylinder.position.y - (cylinder.height / 2);
    const cylinderTop = cylinder.position.y + (cylinder.height / 2);
    
    if (boxMax.y < cylinderBottom || boxMin.y > cylinderTop) {
      return false;
    }
    
    // 2. Check horizontal distance to cylinder axis
    const closestX = Math.max(boxMin.x, Math.min(cylinder.position.x, boxMax.x));
    const closestZ = Math.max(boxMin.z, Math.min(cylinder.position.z, boxMax.z));
    
    const horizontalDistance = new THREE.Vector2(
      closestX - cylinder.position.x,
      closestZ - cylinder.position.z
    ).length();
    
    // Calculate relevant radius based on vertical position
    let relevantRadius;
    if (boxMin.y > cylinder.position.y) {
      relevantRadius = cylinder.radiusTop;
    } else if (boxMax.y < cylinder.position.y) {
      relevantRadius = cylinder.radiusBottom;
    } else {
      const t = (Math.max(boxMin.y, cylinder.position.y) - cylinderBottom) / cylinder.height;
      relevantRadius = cylinder.radiusBottom + t * (cylinder.radiusTop - cylinder.radiusBottom);
    }
    
    return horizontalDistance < relevantRadius;
  }
  
  // Precise tetrahedron collision detection using actual geometry
function checkBoxTetrahedronCollision(box, tetrahedron) {
    // Get box properties
    const boxSize = box.size || COLLISION.PLAYER_SIZE;
    const boxAABB = createBox3FromPositionAndSize(box.position, boxSize);
    
    // First quick test - if the bounding boxes don't intersect, there's no collision
    const tetraRadius = tetrahedron.radius;
    const tetraBBox = new THREE.Box3(
      new THREE.Vector3(
        tetrahedron.position.x - tetraRadius,
        tetrahedron.position.y - tetraRadius,
        tetrahedron.position.z - tetraRadius
      ),
      new THREE.Vector3(
        tetrahedron.position.x + tetraRadius,
        tetrahedron.position.y + tetraRadius,
        tetrahedron.position.z + tetraRadius
      )
    );
    
    if (!boxAABB.intersectsBox(tetraBBox)) {
      return false;
    }
    
    // Create the four vertices of the tetrahedron
    const baseRadius = tetraRadius * 0.75; // Base is a bit smaller than the full radius
    const height = tetraRadius * 1.5;
    
    // Top vertex
    const top = new THREE.Vector3(
      tetrahedron.position.x,
      tetrahedron.position.y + (height * 0.7), // Top point is higher
      tetrahedron.position.z
    );
    
    // Calculate the three base vertices (forming a triangle at the bottom)
    const baseY = tetrahedron.position.y - (height * 0.3); // Base is lower
    const baseVertices = [
      new THREE.Vector3(
        tetrahedron.position.x + baseRadius * Math.cos(0),
        baseY,
        tetrahedron.position.z + baseRadius * Math.sin(0)
      ),
      new THREE.Vector3(
        tetrahedron.position.x + baseRadius * Math.cos(2 * Math.PI / 3),
        baseY,
        tetrahedron.position.z + baseRadius * Math.sin(2 * Math.PI / 3)
      ),
      new THREE.Vector3(
        tetrahedron.position.x + baseRadius * Math.cos(4 * Math.PI / 3),
        baseY,
        tetrahedron.position.z + baseRadius * Math.sin(4 * Math.PI / 3)
      )
    ];
    
    // Define the four faces of the tetrahedron (each face is a triangle)
    const faces = [
      [top, baseVertices[0], baseVertices[1]], // Side face 1
      [top, baseVertices[1], baseVertices[2]], // Side face 2
      [top, baseVertices[2], baseVertices[0]], // Side face 3
      [baseVertices[0], baseVertices[2], baseVertices[1]] // Base face
    ];
    
    // Get the eight corners of the player's box
    const boxCorners = [
      new THREE.Vector3(boxAABB.min.x, boxAABB.min.y, boxAABB.min.z),
      new THREE.Vector3(boxAABB.min.x, boxAABB.min.y, boxAABB.max.z),
      new THREE.Vector3(boxAABB.min.x, boxAABB.max.y, boxAABB.min.z),
      new THREE.Vector3(boxAABB.min.x, boxAABB.max.y, boxAABB.max.z),
      new THREE.Vector3(boxAABB.max.x, boxAABB.min.y, boxAABB.min.z),
      new THREE.Vector3(boxAABB.max.x, boxAABB.min.y, boxAABB.max.z),
      new THREE.Vector3(boxAABB.max.x, boxAABB.max.y, boxAABB.min.z),
      new THREE.Vector3(boxAABB.max.x, boxAABB.max.y, boxAABB.max.z)
    ];
    
    // Check if any corner of the box is inside the tetrahedron
    for (const corner of boxCorners) {
      if (isPointInTetrahedron(corner, top, baseVertices)) {
        return true;
      }
    }
    
    // Check if any edge of the box intersects any face of the tetrahedron
    const boxEdges = [
      [boxCorners[0], boxCorners[1]], [boxCorners[0], boxCorners[2]], [boxCorners[0], boxCorners[4]],
      [boxCorners[1], boxCorners[3]], [boxCorners[1], boxCorners[5]],
      [boxCorners[2], boxCorners[3]], [boxCorners[2], boxCorners[6]],
      [boxCorners[3], boxCorners[7]],
      [boxCorners[4], boxCorners[5]], [boxCorners[4], boxCorners[6]],
      [boxCorners[5], boxCorners[7]],
      [boxCorners[6], boxCorners[7]]
    ];
    
    for (const edge of boxEdges) {
      for (const face of faces) {
        if (lineIntersectsTriangle(edge[0], edge[1], face[0], face[1], face[2])) {
          return true;
        }
      }
    }
    
    // If we get here, there's no collision
    return false;
  }
  
  // Helper function to check if a point is inside a tetrahedron
  function isPointInTetrahedron(p, top, baseVertices) {
    // Use barycentric coordinates to check if point is inside
    // For simplicity, check against each face's plane
    const faces = [
      [top, baseVertices[0], baseVertices[1]], // Side face 1
      [top, baseVertices[1], baseVertices[2]], // Side face 2
      [top, baseVertices[2], baseVertices[0]], // Side face 3
      [baseVertices[0], baseVertices[2], baseVertices[1]] // Base face
    ];
    
    for (const face of faces) {
      // Calculate face normal (pointing outward)
      const edge1 = new THREE.Vector3().subVectors(face[1], face[0]);
      const edge2 = new THREE.Vector3().subVectors(face[2], face[0]);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
      
      // Vector from a point on the face to the test point
      const toPoint = new THREE.Vector3().subVectors(p, face[0]);
      
      // If dot product is positive, the point is on the "wrong" side of the face
      if (normal.dot(toPoint) > 0) {
        return false;
      }
    }
    
    // If we made it through all faces without failing, the point is inside
    return true;
  }
  
  // Helper function to check if a line segment intersects a triangle
  function lineIntersectsTriangle(lineStart, lineEnd, triA, triB, triC) {
    // Create vectors for two edges of the triangle
    const edge1 = new THREE.Vector3().subVectors(triB, triA);
    const edge2 = new THREE.Vector3().subVectors(triC, triA);
    
    // Direction vector for the line
    const lineDir = new THREE.Vector3().subVectors(lineEnd, lineStart);
    const lineLength = lineDir.length();
    lineDir.normalize();
    
    // Calculate the normal to the triangle face
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // Calculate the intersection parameter (t) for the line with the triangle's plane
    const denom = normal.dot(lineDir);
    
    // If denom is zero, the line is parallel to the triangle
    if (Math.abs(denom) < 0.0001) {
      return false;
    }
    
    const toStart = new THREE.Vector3().subVectors(lineStart, triA);
    const t = -normal.dot(toStart) / denom;
    
    // If t is outside the line segment, no intersection
    if (t < 0 || t > lineLength) {
      return false;
    }
    
    // Calculate the intersection point
    const intersectionPoint = new THREE.Vector3()
      .addVectors(lineStart, lineDir.clone().multiplyScalar(t));
    
    // Check if the intersection point is inside the triangle using barycentric coordinates
    const v0 = edge1;
    const v1 = edge2;
    const v2 = new THREE.Vector3().subVectors(intersectionPoint, triA);
    
    const dot00 = v0.dot(v0);
    const dot01 = v0.dot(v1);
    const dot02 = v0.dot(v2);
    const dot11 = v1.dot(v1);
    const dot12 = v1.dot(v2);
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    // Check if point is inside the triangle
    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }
  
  // Check for collision between obstacles with different shapes
  function checkObstacleCollision(entity, obstacle) {
    if (!entity || !obstacle) return false;
    
    if (obstacle.shape.type === 'box') {
      return checkOrientedBoxCollision(entity, {
        position: obstacle.position,
        rotation: obstacle.rotation ? obstacle.rotation.y : 0,
        size: obstacle.shape.size
      });
    }
    else if (obstacle.shape.type === 'cylinder') {
      return checkBoxCylinderCollision(entity, {
        position: obstacle.position,
        radiusTop: obstacle.shape.radiusTop,
        radiusBottom: obstacle.shape.radiusBottom,
        height: obstacle.shape.height
      });
    }
    else if (obstacle.shape.type === 'tetrahedron') {
      return checkBoxTetrahedronCollision(entity, {
        position: obstacle.position,
        radius: obstacle.shape.radius,
        vertices: obstacle.shape.vertices || []
      });
    }
    else if (obstacle.shape.type === 'sphere') {
      return checkBoxSphereCollision(entity, {
        position: obstacle.position,
        radius: obstacle.shape.radius
      });
    }
    
    return false;
  }
  
  // Check for player collisions
  function checkPlayerCollisions() {
    if (!PLAYER || !PLAYER.bike) return { collision: false };
    
    const playerBox = collisionBoxes.player;
    
    // Create an additional "nose" collision box that extends further forward
    const playerDirection = PLAYER.direction.clone().normalize();
    const nosePosition = PLAYER.bike.position.clone().add(
      playerDirection.clone().multiplyScalar(10) // Extend 3 units forward
    );
    
    const noseBox = {
      position: nosePosition,
      rotation: playerBox.rotation,
      size: { width: 2, height: 2, depth: 0.5 } // Smaller than the main box
    };
    
    // 1. Boundary collision checks - no change
    if (
      Math.abs(playerBox.position.x) > CONFIG.WORLD_SIZE / 2 - COLLISION.BOUNDARY_MARGIN ||
      Math.abs(playerBox.position.z) > CONFIG.WORLD_SIZE / 2 - COLLISION.BOUNDARY_MARGIN
    ) {
      return { collision: true, reason: "wall" };
    }
    
    // 2. Obstacle collisions - check both main box and nose
    for (const obstacleCache of collisionBoxes.obstacles) {
      if (!obstacleCache || !obstacleCache.position || !obstacleCache.object) continue;
      
      const obstacle = obstacleCache.object;
      
      // Skip boundary walls
      if (obstacle.geometry && obstacle.geometry.type === 'BoxGeometry' &&
          (Math.abs(obstacle.position.x) === CONFIG.WORLD_SIZE / 2 ||
           Math.abs(obstacle.position.z) === CONFIG.WORLD_SIZE / 2)) {
        continue;
      }
      
      // Check main box
      if (checkObstacleCollision(playerBox, obstacleCache)) {
        return { collision: true, reason: "obstacle" };
      }
      
      // Check nose box - ONLY for obstacles, not for trails!
      if (checkObstacleCollision(noseBox, obstacleCache)) {
        return { collision: true, reason: "obstacle" };
      }
    }
    
    // 3. Own trail collision - IMPORTANT: Only use main box, not nose!
    for (let i = 0; i < PLAYER.trail.length - COLLISION.TRAIL_SEGMENTS_TO_IGNORE; i++) {
      const segment = PLAYER.trail[i];
      if (!segment || !segment.mesh) continue;
      
      const trailBox = {
        position: segment.mesh.position,
        rotation: segment.mesh.rotation.y,
        size: COLLISION.TRAIL_SIZE
      };
      
      if (checkOrientedBoxCollision(playerBox, trailBox)) {
        return { collision: true, reason: "own trail" };
      }
      
      // Do NOT check nose collision with own trail
    }
    
    // 4. AI bikes and trails - check both boxes for AI bikes, only main box for trails
    for (const aiBike of AI.bikes) {
      if (!aiBike || !aiBike.position) continue;
      
      const aiIndex = AI.bikes.indexOf(aiBike);
      const aiBox = collisionBoxes.ais[aiIndex];
      
      if (aiBox && checkOrientedBoxCollision(playerBox, aiBox)) {
        return { collision: true, reason: "AI bike" };
      }
      
      if (aiBox && checkOrientedBoxCollision(noseBox, aiBox)) {
        return { collision: true, reason: "AI bike" };
      }
      
      if (aiBike.userData && aiBike.userData.trail) {
        for (let i = 0; i < aiBike.userData.trail.length - COLLISION.TRAIL_SEGMENTS_TO_IGNORE; i++) {
          const segment = aiBike.userData.trail[i];
          if (!segment || !segment.mesh) continue;
          
          const trailBox = {
            position: segment.mesh.position,
            rotation: segment.mesh.rotation.y,
            size: COLLISION.TRAIL_SIZE
          };
          
          if (checkOrientedBoxCollision(playerBox, trailBox)) {
            return { collision: true, reason: "AI trail" };
          }
          
          // Do NOT check nose collision with trails
        }
      }
    }
    
    return { collision: false };
  }
  
  // Check for AI collisions
  function checkAICollisions(aiBike) {
    if (!aiBike || !aiBike.position) return { collision: false };
    
    const aiIndex = AI.bikes.indexOf(aiBike);
    const aiBox = collisionBoxes.ais[aiIndex];
    
    if (!aiBox) return { collision: false };
    
    // 1. Boundaries check
    if (
      Math.abs(aiBox.position.x) > CONFIG.WORLD_SIZE / 2 - COLLISION.BOUNDARY_MARGIN ||
      Math.abs(aiBox.position.z) > CONFIG.WORLD_SIZE / 2 - COLLISION.BOUNDARY_MARGIN
    ) {
      return { collision: true, reason: "wall" };
    }
    
    // 2. Obstacles check
    for (const obstacleCache of collisionBoxes.obstacles) {
      if (!obstacleCache || !obstacleCache.position) continue;
      
      const obstacle = obstacleCache.object;
      if (!obstacle) continue;
      
      if (obstacle.geometry && obstacle.geometry.type === 'BoxGeometry' &&
          (Math.abs(obstacle.position.x) === CONFIG.WORLD_SIZE / 2 ||
           Math.abs(obstacle.position.z) === CONFIG.WORLD_SIZE / 2)) {
        continue;
      }
      
      if (checkObstacleCollision(aiBox, obstacleCache)) {
        return { collision: true, reason: "obstacle" };
      }
    }
    
    // 3. Own trail collision
    if (aiBike.userData && aiBike.userData.trail) {
      for (let i = 0; i < aiBike.userData.trail.length - COLLISION.TRAIL_SEGMENTS_TO_IGNORE; i++) {
        const segment = aiBike.userData.trail[i];
        if (!segment || !segment.mesh) continue;
        
        const trailBox = {
          position: segment.mesh.position,
          rotation: segment.mesh.rotation.y,
          size: COLLISION.TRAIL_SIZE
        };
        
        if (checkOrientedBoxCollision(aiBox, trailBox)) {
          return { collision: true, reason: "own trail" };
        }
      }
    }
    
    // 4. Player trail and bike
    if (PLAYER && PLAYER.bike) {
      const playerBox = collisionBoxes.player;
      
      if (playerBox && checkOrientedBoxCollision(aiBox, playerBox)) {
        return { collision: true, reason: "player bike" };
      }
      
      for (let segment of PLAYER.trail) {
        if (!segment || !segment.mesh) continue;
        
        const trailBox = {
          position: segment.mesh.position,
          rotation: segment.mesh.rotation.y,
          size: COLLISION.TRAIL_SIZE
        };
        
        if (checkOrientedBoxCollision(aiBox, trailBox)) {
          return { collision: true, reason: "player trail" };
        }
      }
    }
    
    // 5. Other AI bikes and trails
    for (let otherAI of AI.bikes) {
      if (!otherAI || !otherAI.position || otherAI === aiBike) continue;
      
      const otherAiIndex = AI.bikes.indexOf(otherAI);
      const otherAiBox = collisionBoxes.ais[otherAiIndex];
      
      if (otherAiBox && checkOrientedBoxCollision(aiBox, otherAiBox)) {
        return { collision: true, reason: "other AI bike" };
      }
      
      if (otherAI.userData && otherAI.userData.trail) {
        for (let segment of otherAI.userData.trail) {
          if (!segment || !segment.mesh) continue;
          
          const trailBox = {
            position: segment.mesh.position,
            rotation: segment.mesh.rotation.y,
            size: COLLISION.TRAIL_SIZE
          };
          
          if (checkOrientedBoxCollision(aiBox, trailBox)) {
            return { collision: true, reason: "other AI trail" };
          }
        }
      }
    }
    
    return { collision: false };
  }
  
  // Check for powerup collections
  function checkPowerupCollisions() {
    if (!PLAYER || !PLAYER.bike) return [];
    
    const collectibles = [];
    const playerBox = collisionBoxes.player;
    
    // Check player powerup collisions
    for (let i = 0; i < POWERUPS.items.length; i++) {
      const powerup = POWERUPS.items[i];
      if (!powerup || !powerup.position) continue;
      
      const powerupSphere = {
        position: powerup.position,
        radius: COLLISION.POWERUP_RADIUS
      };
      
      if (playerBox && checkBoxSphereCollision(playerBox, powerupSphere)) {
        collectibles.push({
          type: 'player',
          powerup: powerup,
          index: i
        });
      }
    }
    
    // Check AI powerup collisions
    for (let aiIndex = 0; aiIndex < AI.bikes.length; aiIndex++) {
      const aiBike = AI.bikes[aiIndex];
      if (!aiBike || !aiBike.position) continue;
      
      const aiBox = collisionBoxes.ais[aiIndex];
      if (!aiBox) continue;
      
      for (let i = 0; i < POWERUPS.items.length; i++) {
        const powerup = POWERUPS.items[i];
        if (!powerup || !powerup.position) continue;
        
        const powerupSphere = {
          position: powerup.position,
          radius: COLLISION.POWERUP_RADIUS
        };
        
        if (checkBoxSphereCollision(aiBox, powerupSphere)) {
          collectibles.push({
            type: 'ai',
            powerup: powerup,
            index: i,
            ai: aiBike
          });
        }
      }
    }
    
    return collectibles;
  }
  
  // Check for portal interactions
  function checkPortalCollisions() {
    if (!PLAYER || !PLAYER.bike) return [];
    
    const interactions = [];
    
    // Check each portal
    for (const portalType in collisionBoxes.portals) {
      const portalData = collisionBoxes.portals[portalType];
      if (!portalData || !portalData.box) continue;
      
      // Calculate distance to portal center
      const portalCenter = new THREE.Vector3();
      portalData.box.getCenter(portalCenter);
      
      const distance = PLAYER.bike.position.distanceTo(portalCenter);
      
      // Different interaction zones
      if (distance < 15) {
        // Close interaction (teleport)
        interactions.push({
          type: portalData.type,
          distance: distance,
          interaction: 'teleport'
        });
      } else if (distance < 50) {
        // Proximity interaction (effects, UI, etc)
        interactions.push({
          type: portalData.type,
          distance: distance,
          interaction: 'proximity'
        });
      }
    }
    
    return interactions;
  }
  
  // Handle portal teleportation
  function handlePortalTeleport(portalType) {
    switch (portalType) {
      case 'exit':
        // Handle exit portal teleport
        const currentParams = new URLSearchParams(window.location.search);
        const newParams = new URLSearchParams();
        newParams.append('portal', 'true');
        newParams.append('score', PLAYER.score);
        newParams.append('color', RENDERER.effectsConfig.playerColor);
        
        for (const [key, value] of currentParams) {
          if (!['portal', 'score', 'color'].includes(key)) {
            newParams.append(key, value);
          }
        }
        
        const paramString = newParams.toString();
        const nextPage = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '');
        window.location.href = nextPage;
        break;
        
      case 'metaverse':
        // Handle metaverse portal teleport
        window.location.href = "https://metaverse-delta.vercel.app/";
        break;
        
      case 'start':
        // Handle start portal teleport
        const urlParams = new URLSearchParams(window.location.search);
        const refUrl = urlParams.get('ref');
        
        if (refUrl) {
          let url = refUrl;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          
          const currentParams = new URLSearchParams(window.location.search);
          const returnParams = new URLSearchParams();
          
          for (const [key, value] of currentParams) {
            if (key !== 'ref') {
              returnParams.append(key, value);
            }
          }
          
          const paramString = returnParams.toString();
          window.location.href = url + (paramString ? '?' + paramString : '');
        }
        break;
    }
  }
  
  // Main collision detection function called each frame
  // In updateCollisions function (collisions.js)
function updateCollisions() {
  // Only update dynamic collision boxes at a lower frequency on mobile
  if (!CONFIG.IS_MOBILE || RENDERER.clock.getElapsedTime() % 2 < 1) {
    updateDynamicCollisionBoxes();
  }
  
  // Check player collisions (this is critical and should run every frame)
  const playerCollision = checkPlayerCollisions();
  if (playerCollision.collision) {
    createWireframesForNextGame();
    gameOver("GAME OVER - " + playerCollision.reason.toUpperCase());
    return;
  }
  
  // For AI collision checks, we can be more efficient
  // Run these checks less frequently as they're less critical
  if (RENDERER.clock.getElapsedTime() % 3 < 1) {
    // Process AI collisions
    const processedAIs = new Map();
    
    for (let i = 0; i < AI.bikes.length; i++) {
      const aiBike = AI.bikes[i];
      if (!aiBike || !aiBike.position || processedAIs.has(aiBike)) continue;
      
      // Quick distance check before detailed collision
      const playerDistance = aiBike.position.distanceTo(PLAYER.bike.position);
      if (playerDistance > 50) {
        // Only do detailed collision if within reasonable distance
        continue;
      }
      
      const aiCollision = checkAICollisions(aiBike);
      
      if (aiCollision.collision) {
        processedAIs.set(aiBike, true);
        try {
          if (typeof learnFromCrash === 'function') {
            learnFromCrash(aiBike, aiCollision.reason);
          } else if (typeof AI.learnFromCrash === 'function') {
            AI.learnFromCrash(aiBike, aiCollision.reason);
          } else {
            if (typeof respawnAI === 'function') {
              respawnAI(aiBike);
            } else if (typeof AI.respawnAI === 'function') {
              AI.respawnAI(aiBike);
            }
          }
        } catch (e) {
          console.error("Error in AI crash handling:", e);
        }
      }
    }
  }
  
  // Process powerups with throttling
  const powerupCollisions = checkPowerupCollisions();
  processPowerupCollisions(powerupCollisions);
}
    
    // Create wireframe visualizers for the NEXT game based on current obstacles
    function createWireframesForNextGame() {
      // First, clear any existing wireframes that will be stored
      previousGameWireframes = [];
      
      // Create new wireframes for current obstacles
      const newWireframes = [];
      
      // Create obstacle visualizers
      for (const obstacleCache of collisionBoxes.obstacles) {
        if (!obstacleCache || !obstacleCache.position) continue;
        
        let visualizer;
        
        // Create visualizer based on shape type
        if (obstacleCache.shape.type === 'box') {
          // Box visualizer
          visualizer = createBoxVisualizer(
            obstacleCache.position, 
            obstacleCache.shape.size, 
            obstacleCache.rotation ? obstacleCache.rotation.y : 0, 
            0xff0000
          );
        } 
        else if (obstacleCache.shape.type === 'cylinder') {
          // Cylinder visualizer
          const radiusTop = obstacleCache.shape.radiusTop;
          const radiusBottom = obstacleCache.shape.radiusBottom;
          const height = obstacleCache.shape.height;
          
          visualizer = new THREE.Mesh(
            new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16),
            new THREE.MeshBasicMaterial({ 
              color: 0xffff00, 
              wireframe: true, 
              opacity: COLLISION.GHOST_WIREFRAME_OPACITY, 
              transparent: true 
            })
          );
          visualizer.position.copy(obstacleCache.position);
          visualizer.rotation.copy(obstacleCache.rotation || new THREE.Euler());
        }
        else if (obstacleCache.shape.type === 'tetrahedron') {
          // Tetrahedron visualizer
          visualizer = new THREE.Mesh(
            new THREE.TetrahedronGeometry(obstacleCache.shape.radius, 0),
            new THREE.MeshBasicMaterial({ 
              color: 0xffaa00, 
              wireframe: true, 
              opacity: COLLISION.GHOST_WIREFRAME_OPACITY, 
              transparent: true 
            })
          );
          visualizer.position.copy(obstacleCache.position);
          visualizer.rotation.copy(obstacleCache.rotation || new THREE.Euler());
        }
        else if (obstacleCache.shape.type === 'sphere') {
          // Sphere visualizer
          visualizer = new THREE.Mesh(
            new THREE.SphereGeometry(obstacleCache.shape.radius, 16, 16),
            new THREE.MeshBasicMaterial({ 
              color: 0xff0000, 
              wireframe: true, 
              opacity: COLLISION.GHOST_WIREFRAME_OPACITY, 
              transparent: true 
            })
          );
          visualizer.position.copy(obstacleCache.position);
        }
        
        // Store the visualizer but don't add it to the scene yet
        if (visualizer) {
          visualizer.userData.isGhostWireframe = true;
          visualizer.name = 'ghost-wireframe';
          newWireframes.push(visualizer);
        }
      }
      
      // Store the new wireframes for the next game
      previousGameWireframes = newWireframes;
    }
    
    // Show the previous game's wireframes in the current game
    function showPreviousGameWireframes() {
      // Add all stored wireframes to the scene
      previousGameWireframes.forEach(visualizer => {
        RENDERER.scene.add(visualizer);
      });
    }
    
    // Remove current wireframes (to be called when initializing a new game)
    function removeCurrentWireframes() {
      // Remove any wireframes that are currently in the scene
      const existingWireframes = RENDERER.scene.children.filter(obj => 
        obj.userData && obj.userData.isGhostWireframe);
      
      existingWireframes.forEach(wireframe => {
        RENDERER.scene.remove(wireframe);
      });
    }
    
    // Helper to create a box visualizer
    function createBoxVisualizer(position, size, rotation, color) {
      // Create a BoxGeometry with the specified size
      const geometry = new THREE.BoxGeometry(
        size.width + COLLISION.COLLISION_PADDING * 2,
        size.height + COLLISION.COLLISION_PADDING * 2,
        size.depth + COLLISION.COLLISION_PADDING * 2
      );
      
      // Create a wireframe material
      const material = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        opacity: COLLISION.GHOST_WIREFRAME_OPACITY,
        transparent: true
      });
      
      // Create a mesh with the geometry and material
      const boxMesh = new THREE.Mesh(geometry, material);
      boxMesh.position.copy(position);
      boxMesh.rotation.y = rotation || 0;
      
      boxMesh.userData.isGhostWireframe = true;
      boxMesh.name = 'ghost-wireframe';
      
      return boxMesh;
    }
    
    // Toggle wireframe visibility
    function toggleGhostWireframes() {
      // Find all ghost wireframes in the scene
      const wireframes = RENDERER.scene.children.filter(obj => 
        obj.userData && obj.userData.isGhostWireframe);
      
      if (wireframes.length > 0) {
        // Toggle visibility
        const firstVisible = wireframes[0].visible;
        wireframes.forEach(w => w.visible = !firstVisible);
      }
    }
    
    // Additionally hook into the game's restart function to create wireframes
    // This should be called whenever a game is restarted manually
    function handleGameRestart() {
      // Create wireframes from the current obstacles
      createWireframesForNextGame();
    }
    
    // Add key press to toggle wireframes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        // Toggle wireframes
        toggleGhostWireframes();
      }
    });
    
    // Override the original gameOver function to create wireframes before ending
    const originalGameOver = window.gameOver;
    window.gameOver = function(message) {
      // Create wireframes for the next game
      createWireframesForNextGame();
      
      // Call the original gameOver function
      if (originalGameOver) {
        originalGameOver(message);
      }
    };


    
    // Expose the collision system functions
    const COLLISIONS = {
      initCollisionBoxes,
      updateDynamicCollisionBoxes,
      checkPlayerCollisions,
      checkAICollisions,
      checkPowerupCollisions,
      checkPortalCollisions,
      updateCollisions,
      createWireframesForNextGame,
      toggleGhostWireframes,
      handleGameRestart,
      collisionBoxes,
      COLLISION
    };

    // Enhanced Ghost Wireframe UI - Add after COLLISIONS object definition

// Add button to pause menu for ghost wireframes, but only when wireframes exist
function addGhostWireframeButton() {
    const pauseOverlay = document.getElementById('pauseOverlay');
    const resumeButton = document.getElementById('resumeButton');
    
    // Check if wireframes exist (2nd game and beyond)
    const wireframes = RENDERER.scene.children.filter(obj => 
      obj.userData && obj.userData.isGhostWireframe);
    
    // Only create button if wireframes exist and button doesn't exist yet
    if (wireframes.length > 0 && !document.getElementById('ghostWireframeButton')) {
      const ghostButton = document.createElement('button');
      ghostButton.id = 'ghostWireframeButton';
      ghostButton.textContent = wireframes[0].visible ? 'GHOST FRAMES: ON' : 'GHOST FRAMES: OFF';
      ghostButton.style.marginTop = '10px';
      
      ghostButton.addEventListener('click', function() {
        toggleGhostWireframes();
        updateGhostButtonText();
      });
      
      // Insert before the resume button
      pauseOverlay.insertBefore(ghostButton, resumeButton);
      
      // Add ghost wireframe info to controlsInfo for desktop users only
      updateControlsInfo();
      
      // Setup key press listener for the C key 
      setupCKeyListener();
    }
  }
  
  // Update button text based on current wireframe visibility
  function updateGhostButtonText() {
    const ghostButton = document.getElementById('ghostWireframeButton');
    const wireframes = RENDERER.scene.children.filter(obj => 
      obj.userData && obj.userData.isGhostWireframe);
    
    if (ghostButton && wireframes.length > 0) {
      ghostButton.textContent = wireframes[0].visible ? 'GHOST FRAMES: ON' : 'GHOST FRAMES: OFF';
    }
  }
  
  // Add info about ghost wireframes to the controls info for desktop users
  function updateControlsInfo() {
    // Only add ghost frame info for desktop users
    if (!CONFIG.IS_MOBILE) {
      const controlsInfo = document.getElementById('controlsInfo');
      if (controlsInfo) {
        controlsInfo.innerHTML = `
          <p>DESKTOP: Arrow keys to turn, R to restart, P to pause, E for effects, C to toggle ghost frames</p>
          <p>MOBILE: Tap left/right sides or swipe left/right to turn</p>
        `;
      }
    }
  }
  
  // Setup C key listener that updates the button text
  function setupCKeyListener() {
    // Keep reference to the original keydown handler
    const originalKeyDown = window.onKeyDown;
    
    // Override the C key functionality to update button text
    window.onKeyDown = function(event) {
      // Call original handler first
      if (typeof originalKeyDown === 'function') {
        originalKeyDown(event);
      }
      
      // Handle C key for ghost frames
      if (event.keyCode === 67) { // 'C' key
        // Update button text after a short delay
        setTimeout(updateGhostButtonText, 50);
      }
    };
  }
  
  // Initialize the UI enhancements
  function initGhostWireframeUI() {
    // Add the button (will only be added if wireframes exist)
    addGhostWireframeButton();
  }
  
  // Add these functions to the already initialized COLLISIONS object
  if (window.COLLISIONS) {
    COLLISIONS.addGhostWireframeButton = addGhostWireframeButton;
    COLLISIONS.updateGhostButtonText = updateGhostButtonText;
    COLLISIONS.updateControlsInfo = updateControlsInfo;
    COLLISIONS.initGhostWireframeUI = initGhostWireframeUI;
    COLLISIONS.setupCKeyListener = setupCKeyListener;
  }
  
  // Add this function to the js/collisions.js file, after the COLLISIONS object definition

// Enhanced Ghost Wireframe UI - Add after COLLISIONS object definition
function addGhostWireframeButton() {
  const pauseOverlay = document.getElementById('pauseOverlay');
  const resumeButton = document.getElementById('resumeButton');
  
  // Check if wireframes exist (2nd game and beyond)
  const wireframes = RENDERER.scene.children.filter(obj => 
    obj.userData && obj.userData.isGhostWireframe);
  
  // Only create button if wireframes exist and button doesn't exist yet
  if (wireframes.length > 0 && !document.getElementById('ghostWireframeButton')) {
    const ghostButton = document.createElement('button');
    ghostButton.id = 'ghostWireframeButton';
    ghostButton.textContent = wireframes[0].visible ? 'GHOST FRAMES: ON' : 'GHOST FRAMES: OFF';
    ghostButton.style.marginTop = '10px';
    
    ghostButton.addEventListener('click', function() {
      toggleGhostWireframes();
      updateGhostButtonText();
    });
    
    // Insert before the resume button
    pauseOverlay.insertBefore(ghostButton, resumeButton);
    
    // Add ghost wireframe info to controlsInfo for desktop users only
    updateControlsInfo();
    
    // Setup key press listener for the C key 
    setupCKeyListener();
  }
}

// Update button text based on current wireframe visibility
function updateGhostButtonText() {
  const ghostButton = document.getElementById('ghostWireframeButton');
  const wireframes = RENDERER.scene.children.filter(obj => 
    obj.userData && obj.userData.isGhostWireframe);
  
  if (ghostButton && wireframes.length > 0) {
    ghostButton.textContent = wireframes[0].visible ? 'GHOST FRAMES: ON' : 'GHOST FRAMES: OFF';
  }
}

// Add info about ghost wireframes to the controls info for desktop users
function updateControlsInfo() {
  // Only add ghost frame info for desktop users
  if (!CONFIG.IS_MOBILE) {
    const controlsInfo = document.getElementById('controlsInfo');
    if (controlsInfo) {
      controlsInfo.innerHTML = `
        <p>DESKTOP: Arrow keys to turn, R to restart, P to pause, E for effects, C to toggle ghost frames</p>
        <p>MOBILE: Tap left/right sides or swipe left/right to turn</p>
      `;
    }
  }
}

// Setup C key listener that updates the button text
function setupCKeyListener() {
  // Keep reference to the original keydown handler
  const originalKeyDown = window.onKeyDown;
  
  // Override the C key functionality to update button text
  window.onKeyDown = function(event) {
    // Call original handler first
    if (typeof originalKeyDown === 'function') {
      originalKeyDown(event);
    }
    
    // Handle C key for ghost frames
    if (event.keyCode === 67) { // 'C' key
      // Update button text after a short delay
      setTimeout(updateGhostButtonText, 50);
    }
  };
}

// Initialize the UI enhancements
function initGhostWireframeUI() {
  // Add the button (will only be added if wireframes exist)
  addGhostWireframeButton();
}

// Add these functions to the already initialized COLLISIONS object
if (window.COLLISIONS) {
  COLLISIONS.addGhostWireframeButton = addGhostWireframeButton;
  COLLISIONS.updateGhostButtonText = updateGhostButtonText;
  COLLISIONS.updateControlsInfo = updateControlsInfo;
  COLLISIONS.initGhostWireframeUI = initGhostWireframeUI;
  COLLISIONS.setupCKeyListener = setupCKeyListener;
}

// Hook to check for wireframes after game restart
function checkForWireframesAfterRestart() {
  // Check if we're already listening for game over events
  if (!window.isListeningForGameOver) {
    // Watch for restart button clicks
    const restartButton = document.getElementById('returnToMenuButton');
    if (restartButton) {
      restartButton.addEventListener('click', function() {
        // When game is restarted, check for wireframes after a delay
        setTimeout(() => {
          if (window.COLLISIONS && typeof COLLISIONS.addGhostWireframeButton === 'function') {
            COLLISIONS.addGhostWireframeButton();
          }
        }, 1000);
      });
    }
    
    // Also check when pause overlay is shown
    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
      pauseButton.addEventListener('click', function() {
        if (window.COLLISIONS && typeof COLLISIONS.addGhostWireframeButton === 'function') {
          COLLISIONS.addGhostWireframeButton();
        }
      });
    }
    
    window.isListeningForGameOver = true;
  }
}

// Call this instead of modifying the originalGameOver
checkForWireframesAfterRestart();

// Set up a MutationObserver to watch for wireframes being added to the scene
function watchForWireframes() {
  // Check if wireframes appear after some time
  const checkInterval = setInterval(() => {
    const wireframes = RENDERER.scene.children.filter(obj => 
      obj.userData && obj.userData.isGhostWireframe);
    
    if (wireframes.length > 0) {
      addGhostWireframeButton();
      clearInterval(checkInterval);
    }
  }, 1000);
  
  // Stop checking after 15 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 15000);
}

// Start watching for wireframes
watchForWireframes();
