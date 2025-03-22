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
    
    this.score = 0;
    this.shotsTaken = 0;
    this.maxShots = 5;
    this.gameState = 'ready'; // 'ready', 'shooting', 'saving', 'celebrating', 'gameOver'
    
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
    
    // Create goalkeeper
    this.goalkeeper = new Goalkeeper(this.scene, this.difficulty);
    
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
    
    // Calculate power based on difficulty (higher difficulty = harder shots)
    const power = 0.7 + (this.difficulty / 100) * 0.3; // 0.7 to 1.0
    
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
    
    // Goalkeeper tries to save
    setTimeout(() => {
      this.goalkeeper.dive(direction);
    }, 300); // Small delay for goalkeeper reaction time
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
    
    if (this.shotsTaken >= this.maxShots) {
      // Game over
      this.gameState = 'gameOver';
      
      const finalScore = `${this.score}/${this.maxShots}`;
      instructions.textContent = `Game Over! Final Score: ${finalScore}`;
      
      // Game over functionality could be expanded here
    } else {
      // Reset for next shot
      this.reset();
      
      if (this.mode === 'shoot') {
        instructions.textContent = 'Use arrow keys to aim, SPACE to shoot.';
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
  }
  
  // Update score display
  updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `${this.score}/${this.shotsTaken} (${this.maxShots - this.shotsTaken} shots left)`;
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
      instructions.textContent = 'Use arrow keys to aim, SPACE to shoot.';
    } else {
      this.setupAutoShot();
    }
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