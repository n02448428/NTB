# Neon Trailblazer - System Architecture

## Overview
Neon Trailblazer is a TRON-inspired game where players control a neon bike that leaves a light trail. The game architecture is organized into multiple modules to maintain separation of concerns and improve code maintainability.

## Core Components

### 1. Entry Points
- **index.html**: Main HTML document that loads all resources
- **main.js**: Core initialization and game loop, coordinates all other modules
- **config.js**: Contains game constants and configuration settings

### 2. Rendering System
- **renderer.js**: Manages Three.js scene, camera, and rendering pipeline
- **shaders.js**: Custom shader definitions for visual effects (pixelation, color processing, scanlines)

### 3. Game World
- **world.js**: Creates and manages game environment (boundaries, obstacles)
- **player.js**: Player bike creation, movement, and trail system
- **aiSystem.js**: AI bike creation, movement logic, decision making, and learning algorithms
- **portal.js**: Portal system for navigation between game areas
- **powerups.js**: Powerup creation, collection mechanics, and animations

### 4. Input & Interaction
- **controls.js**: Handles keyboard and touch input
- **collisions.js**: Manages collision detection between all game entities

### 5. UI & Effects
- **ui.js**: Manages user interfaces (menus, game over screen)
- **effectsSystem.js**: Visual effects control and preset management
- **audio.js**: Background music and sound effects
- **leaderboard.js**: Local and online leaderboard functionality
- **preview.js**: Manages the 3D preview on the splash screen

### 6. Utilities
- **utils.js**: Helper functions used across modules (toast notifications, clipboard functions, hash encoding/decoding)
- **styles.css**: All game styling

## Initialization Flow
1. **index.html** loads all required scripts and sets up the DOM structure
2. **main.js:init()** is called on page load
3. **main.js** initializes the renderer, creates the world, player, AI, and other game elements
4. **preview.js** sets up the splash screen preview camera
5. Once the player clicks "Start", **main.js:animate()** begins the game loop

## Game Loop
The game loop runs every frame and is orchestrated by **main.js:animate()**:
1. Render the scene using **renderer.js**
2. If game is active (not paused or game over):
   - Update player position and check for collisions
   - Update AI movement and decision making
   - Check for powerup collections
   - Update camera position to follow player
   - Apply visual effects

## Module Interactions

### Renderer Module
- Accessed by almost all modules to add/remove objects from the scene
- **RENDERER.scene**: Three.js scene where all game objects exist
- **RENDERER.effectsConfig**: Visual effect settings that can be modified by effects system

### Player Module
- Exposes PLAYER object with bike, direction, trail data
- Called by **main.js** to update movement
- Used by **collisions.js** to detect interactions
- Accessed by **powerups.js** when player collects powerups

### AI System
- Provides createAIBike(), updateAIMovement(), learnFromSuccess() and other functions
- Uses **world.js** obstacles data for pathfinding
- Uses **PLAYER** data to target/avoid the player
- Integrates with **powerups.js** for learning reinforcement

### Powerups System
- Creates and manages powerup entities
- Tracks powerup collections by player and AI
- Calls learning functions on AI when they collect powerups

### UI Module
- Manages game state transitions (splash screen, game over)
- Updates score display and leaderboard
- Controlled by **main.js** for major state changes

### Effects System
- Controls visual effects application via **RENDERER**
- Stores and manages effect presets
- Directly modifies shader parameters

## Data Flow Examples

### Starting the game:
1. User clicks "Start" button
2. **ui.js:startGame()** is called
3. Game state is updated in **CONFIG.STATE**
4. **ui.js** hides splash screen and shows game UI
5. **main.js** animation loop begins updating game state

### Player collecting a powerup:
1. **main.js** calls **powerups.js:checkPowerups()**
2. Function detects intersection between player and powerup
3. Powerup is removed from scene
4. Player's trail length and score are increased
5. UI is updated via **updateScore()**

### AI decision making:
1. **main.js** calls **aiSystem.js:updateAIMovement()**
2. For each AI bike, **updateAIDirection()** evaluates possible moves
3. AI evaluates options based on obstacles, trails, powerups
4. Decision is made and AI direction is updated
5. AI learns from each decision via **learnFromDecision()**

## Customization
The game is highly customizable through:
- **config.js**: Game constants and default settings
- **effectsSystem.js**: Visual presets stored in localStorage
- **RENDERER.effectsConfig**: Runtime effect configuration

## Error Handling
- Graceful degradation for audio when autoplay is prevented
- Fallback to local leaderboard when online saving fails
- Adaptive touch controls based on device detection

This modular architecture allows for easy maintenance, feature additions, and bug fixes by isolating functionality and maintaining clear interfaces between components.