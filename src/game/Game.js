import * as THREE from 'three';
import { Ball } from './Ball.js';
import { Goalkeeper } from './Goalkeeper.js';
import { Player } from './Player.js';
import { Level } from './Level.js';
import { assets } from '../assets/AssetLoader.js';
import { checkGoal, checkSave } from '../utils/Physics.js';

export class Game {
  constructor(options) {
    this.container = options.container;
    this.country = options.country;
    this.mode = options.mode; // 'shoot' or 'save'
    this.difficulty = options.difficulty;
    
    // Score tracking
    this.score = 0;
    this.shotsTaken = 0;
    this.maxShots = 5;
    
    // Level progression
    this.currentLevel = 1;
    this.maxLevel = 100;
    this.levelGoalsRequired = 3; // Number of goals required to advance to next level
    this.levelGoals = 0; // Goals scored in current level
    
    this.gameState = 'ready'; // 'ready', 'shooting', 'saving', 'celebrating', 'levelComplete', 'gameOver'
    
    // Create the Three.js scene
    this.createScene();
    
    // Initialize game elements
    this.initGame();
    
    // Start the animation loop
    this.animate();
  }
  
  // Create the Three.js scene
  createScene() {
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      this.container.clientWidth / this.container.clientHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    // Position camera based on game mode
    if (this.mode === 'shoot') {
      // Position behind player for shooting mode
      this.camera.position.set(0, 3, 20);
      this.camera.lookAt(0, 1, 0);
    } else {
      // Position behind goal for saving mode
      this.camera.position.set(0, 2, -5);
      this.camera.lookAt(0, 1, 10);
    }
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x87CEEB); // Sky blue clear color
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add renderer to DOM
    this.container.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  // Initialize game elements
  initGame() {
    // Create level (field, goal, etc.)
    this.level = new Level(this.scene, assets);
    
    // Create ball
    this.ball = new Ball(this.scene, assets);
    
    // Create goalkeeper with difficulty adjusted by level
    const adjustedDifficulty = Math.min(this.difficulty + (this.currentLevel - 1) * 5, 100);
    this.goalkeeper = new Goalkeeper(this.scene, adjustedDifficulty);
    
    // Create player based on game mode
    if (this.mode === 'shoot') {
      this.player = new Player(this.scene, this.country);
      this.player.setShootCallback(this.handleShoot.bind(this));
      
      // AI goalkeeper
      this.goalkeeper.setPlayerControlled(false);
    } else {
      // AI player/shooter for goalkeeper mode
      // We'll just create a dummy player that's not visible
      this.player = { update: () => {}, dispose: () => {} };
      
      // Player controlled goalkeeper
      this.goalkeeper.setPlayerControlled(true);
      
      // Setup controls for goalkeeper in saving mode
      this.setupGoalkeeperControls();
    }
    
    // Update score display
    this.updateScoreDisplay();
    this.updateLevelDisplay();
    
    // Update game state
    this.gameState = 'ready';
    
    // Setup countdown timer for auto shooting in goalkeeper mode
    if (this.mode === 'save') {
      this.setupAutoShot();
    }
  }
  
  // Setup controls for goalkeeper in saving mode
  setupGoalkeeperControls() {
    // Use arrow keys to dive
    window.addEventListener('keydown', this.handleGoalkeeperControls.bind(this));
  }
  
  // Handle goalkeeper controls
  handleGoalkeeperControls(event) {
    if (this.gameState !== 'saving' || this.goalkeeper.isCurrentlyDiving()) return;
    
    let direction = { x: 0, y: 0 };
    
    switch(event.code) {
      case 'ArrowLeft':
        direction.x = -1;
        break;
      case 'ArrowRight':
        direction.x = 1;
        break;
      case 'ArrowUp':
        direction.y = 0.5;
        break;
      case 'ArrowDown':
        direction.y = -0.2;
        break;
    }
    
    if (direction.x !== 0 || direction.y !== 0) {
      this.goalkeeper.dive(direction);
    }
  }
  
  // Set up automatic shooting for goalkeeper mode
  setupAutoShot() {
    // Show countdown in UI
    const instructions = document.getElementById('instructions');
    instructions.textContent = 'Get ready to save! Shot coming in 3...';
    
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      countdown--;
      
      if (countdown > 0) {
        instructions.textContent = `Get ready to save! Shot coming in ${countdown}...`;
      } else {
        clearInterval(countdownInterval);
        instructions.textContent = 'Use arrow keys to dive and save!';
        
        // Start the shot
        this.gameState = 'saving';
        this.autoShot();
      }
    }, 1000);
  }
  
  // Automatic shot for goalkeeper mode
  autoShot() {
    // Calculate a random direction for the shot
    const randomDirection = {
      x: (Math.random() * 2 - 1) * 0.8, // -0.8 to 0.8 horizontal spread
      y: Math.random() * 0.8 // 0 to 0.8 vertical height
    };
    
    // Calculate power based on difficulty and level (higher difficulty = harder shots)
    const basePower = 0.7;
    const levelAdjustedPower = basePower + (this.currentLevel / 100) * 0.2;
    const power = levelAdjustedPower + (this.difficulty / 100) * 0.1; // 0.7 to 1.0
    
    // Shoot the ball
    this.ball.kick(randomDirection, power, this.difficulty);
  }
  
  // Handle shot from player
  handleShoot(direction, power) {
    if (this.gameState !== 'ready') return;
    
    // Change game state to shooting
    this.gameState = 'shooting';
    
    // Kick the ball
    this.ball.kick(direction, power, this.difficulty);
    
    // Goalkeeper tries to save - reaction time decreases with level
    const reactionTime = Math.max(300 - (this.currentLevel * 2), 100);
    setTimeout(() => {
      // Make goalkeeper more accurate as levels increase
      const adjustedDirection = {
        x: direction.x + (Math.random() * 0.4 - 0.2) * (1 - this.currentLevel/100),
        y: direction.y + (Math.random() * 0.3 - 0.15) * (1 - this.currentLevel/100)
      };
      this.goalkeeper.dive(adjustedDirection);
    }, reactionTime);
  }
  
  // Check result of the shot
  checkShotResult() {
    const goalBounds = this.level.getGoalBounds();
    const isGoal = checkGoal(this.ball.mesh, goalBounds);
    const isSaved = checkSave(this.ball.mesh, this.goalkeeper.group, this.difficulty);
    
    // If the ball is in the goal and not saved, it's a goal
    if (isGoal && !isSaved) {
      // Goal scored!
      this.score++;
      this.levelGoals++;
      this.celebrateGoal();
    } else if (!this.ball.isMoving) {
      // Shot missed or saved
      this.shotComplete(false);
    }
    
    // Update score display
    this.updateScoreDisplay();
  }
  
  // Celebrate a goal
  celebrateGoal() {
    this.gameState = 'celebrating';
    
    // Show celebration message
    const instructions = document.getElementById('instructions');
    instructions.textContent = 'GOAL! Well done!';
    
    // Wait a moment, then continue
    setTimeout(() => {
      this.shotComplete(true);
    }, 2000);
  }
  
  // Shot is complete, prepare for next shot
  shotComplete(wasGoal) {
    this.shotsTaken++;
    
    // Update instructions
    const instructions = document.getElementById('instructions');
    
    // Check if level is complete
    if (this.levelGoals >= this.levelGoalsRequired) {
      // Level complete
      this.gameState = 'levelComplete';
      
      if (this.currentLevel < this.maxLevel) {
        // Advance to next level
        instructions.textContent = `Level ${this.currentLevel} Complete! Advancing to Level ${this.currentLevel + 1}`;
        
        // Wait a moment, then start next level
        setTimeout(() => {
          this.currentLevel++;
          this.levelGoals = 0;
          this.updateLevelDisplay();
          this.resetLevel();
          
          instructions.textContent = `Level ${this.currentLevel}: Score ${this.levelGoalsRequired} goals to advance`;
          setTimeout(() => {
            this.reset();
            if (this.mode === 'shoot') {
              instructions.textContent = 'Use arrow keys to aim, SPACE to shoot.';
            } else {
              this.setupAutoShot();
            }
          }, 2000);
        }, 3000);
      } else {
        // Game complete - all levels finished
        this.gameState = 'gameOver';
        instructions.textContent = `Congratulations! You completed all ${this.maxLevel} levels!`;
      }
    } else if (this.shotsTaken >= this.maxShots) {
      // Out of shots for this level
      this.gameState = 'gameOver';
      
      const goalsNeeded = this.levelGoalsRequired - this.levelGoals;
      instructions.textContent = `Level Failed! You needed ${goalsNeeded} more goal(s) to advance. Try again!`;
      
      // Add a restart button
      const restartButton = document.createElement('button');
      restartButton.textContent = 'Restart Level';
      restartButton.classList.add('btn-primary');
      restartButton.style.marginTop = '20px';
      restartButton.addEventListener('click', () => {
        this.resetLevel();
        instructions.textContent = 'Use arrow keys to aim, SPACE to shoot.';
      });
      
      const gameUI = document.getElementById('game-ui');
      if (gameUI && !document.getElementById('restart-button')) {
        restartButton.id = 'restart-button';
        gameUI.appendChild(restartButton);
      }
    } else {
      // Reset for next shot
      this.reset();
      
      if (this.mode === 'shoot') {
        const goalsNeeded = this.levelGoalsRequired - this.levelGoals;
        instructions.textContent = `Level ${this.currentLevel}: Need ${goalsNeeded} more goal(s). Use arrow keys to aim, SPACE to shoot.`;
      } else {
        // Setup next auto shot for goalkeeper mode
        this.setupAutoShot();
      }
    }
  }
  
  // Reset ball and players for next shot
  reset() {
    this.ball.reset();
    this.goalkeeper.reset();
    
    if (this.player.reset) {
      this.player.reset();
    }
    
    this.gameState = 'ready';
    
    // Remove restart button if it exists
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.remove();
    }
  }
  
  // Reset the entire level
  resetLevel() {
    // Reset scores for this level
    this.shotsTaken = 0;
    this.levelGoals = 0;
    
    // Adjust goalkeeper difficulty based on current level
    const adjustedDifficulty = Math.min(this.difficulty + (this.currentLevel - 1) * 5, 100);
    this.goalkeeper.setDifficulty(adjustedDifficulty);
    
    // Reset everything
    this.reset();
    
    // Update displays
    this.updateScoreDisplay();
    this.updateLevelDisplay();
    
    // Remove restart button if it exists
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.remove();
    }
  }
  
  // Update score display
  updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `${this.score} Total | Level: ${this.levelGoals}/${this.levelGoalsRequired} | Shots: ${this.shotsTaken}/${this.maxShots}`;
    }
  }
  
  // Update level display
  updateLevelDisplay() {
    const instructions = document.getElementById('instructions');
    if (instructions && this.gameState === 'ready') {
      const goalsNeeded = this.levelGoalsRequired - this.levelGoals;
      instructions.textContent = `Level ${this.currentLevel}: Score ${goalsNeeded} more goal(s) to advance`;
    }
    
    // Add level indicator to the UI
    const gameUI = document.getElementById('game-ui');
    let levelDisplay = document.getElementById('level-display');
    
    if (!levelDisplay && gameUI) {
      levelDisplay = document.createElement('div');
      levelDisplay.id = 'level-display';
      levelDisplay.style.marginTop = '10px';
      gameUI.appendChild(levelDisplay);
    }
    
    if (levelDisplay) {
      levelDisplay.textContent = `Level: ${this.currentLevel}/${this.maxLevel}`;
    }
  }
  
  // Handle window resize
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
  
  // Animation loop
  animate() {
    // Use requestAnimationFrame for smooth animation
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    // Calculate delta time for smooth animations regardless of frame rate
    const now = Date.now();
    const deltaTime = (now - (this.lastTime || now)) / 1000;
    this.lastTime = now;
    
    // Update game objects
    this.update(deltaTime);
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Update game objects
  update(deltaTime) {
    // Update ball physics
    this.ball.update(deltaTime);
    
    // Update player
    this.player.update(deltaTime);
    
    // Update goalkeeper
    this.goalkeeper.update(deltaTime);
    
    // Make goalkeeper track the ball when it's moving
    if (this.ball.isMoving && !this.goalkeeper.isCurrentlyDiving()) {
      this.goalkeeper.trackBall(this.ball.getPosition());
    }
    
    // Check shot result if ball is in motion
    if ((this.gameState === 'shooting' || this.gameState === 'saving') && this.ball.isMoving) {
      this.checkShotResult();
    }
  }
  
  // Start the game
  start() {
    // Additional setup if needed
    this.reset();
    
    // Update instructions based on game mode
    const instructions = document.getElementById('instructions');
    if (this.mode === 'shoot') {
      instructions.textContent = `Level ${this.currentLevel}: Score ${this.levelGoalsRequired} goals to advance. Use arrow keys to aim, SPACE to shoot.`;
    } else {
      this.setupAutoShot();
    }
    
    // Update level display
    this.updateLevelDisplay();
  }
  
  // Clean up resources
  dispose() {
    // Stop animation loop
    cancelAnimationFrame(this.animationId);
    
    // Dispose of game objects
    this.ball.dispose();
    this.goalkeeper.dispose();
    this.player.dispose();
    this.level.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    // Remove renderer from DOM
    this.container.removeChild(this.renderer.domElement);
    
    // Dispose of Three.js objects
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object.isMesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
  }
} 