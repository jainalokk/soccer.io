import * as THREE from 'three';
import { getGoalkeeperDiveDirection } from '../utils/Physics.js';

export class Goalkeeper {
  constructor(scene, difficulty) {
    // Keeper properties
    this.width = 2; // Goalkeeper width
    this.height = 1.9; // Goalkeeper height
    this.depth = 0.5; // Goalkeeper depth
    this.difficulty = difficulty;
    this.isDiving = false;
    this.diveProgress = 0;
    this.diveSpeed = 0.05;
    this.diveDirection = { x: 0, y: 0 };
    this.initialPosition = { x: 0, y: 1, z: -0.5 }; // In front of goal
    this.targetPosition = { ...this.initialPosition };
    
    // AI behavior properties
    this.isAnticipating = false;
    this.anticipationAmount = 0;
    this.lastMovementTime = 0;
    this.reflexModifier = difficulty / 100; // Higher difficulty = better reflexes
    
    // Create keeper mesh
    this.createKeeperMesh(scene);
  }
  
  // Create the goalkeeper mesh
  createKeeperMesh(scene) {
    // Create simplified goalkeeper using group of meshes
    this.group = new THREE.Group();
    
    // Keeper body
    const bodyGeometry = new THREE.BoxGeometry(this.width * 0.4, this.height * 0.6, this.depth);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red jersey
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = this.height * 0.3;
    this.group.add(body);
    
    // Keeper head
    const headGeometry = new THREE.SphereGeometry(this.height * 0.15, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac }); // Skin color
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = this.height * 0.65;
    this.group.add(head);
    
    // Keeper legs
    const legGeometry = new THREE.BoxGeometry(this.width * 0.15, this.height * 0.4, this.depth);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black shorts
    
    // Left leg
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(-this.width * 0.13, -this.height * 0.15, 0);
    this.group.add(this.leftLeg);
    
    // Right leg
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(this.width * 0.13, -this.height * 0.15, 0);
    this.group.add(this.rightLeg);
    
    // Keeper arms
    const armGeometry = new THREE.BoxGeometry(this.width * 0.15, this.height * 0.4, this.depth * 0.8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 }); // Yellow gloves/sleeves
    
    // Left arm
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(-this.width * 0.28, this.height * 0.3, 0);
    this.group.add(this.leftArm);
    
    // Right arm
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(this.width * 0.28, this.height * 0.3, 0);
    this.group.add(this.rightArm);
    
    // Apply shadows
    this.group.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    
    // Set initial position
    this.reset();
    
    // Add to scene
    scene.add(this.group);
  }
  
  // Update goalkeeper position and animation
  update(deltaTime) {
    if (this.isDiving) {
      // Update dive progress
      this.diveProgress += this.diveSpeed * (1 + this.reflexModifier); // Faster dives at higher difficulty
      
      if (this.diveProgress >= 1) {
        this.diveProgress = 1;
      }
      
      // Calculate current position based on dive progress with easing
      const easeOutQuad = 1 - Math.pow(1 - this.diveProgress, 2);
      this.group.position.x = this.initialPosition.x + (this.targetPosition.x - this.initialPosition.x) * easeOutQuad;
      this.group.position.y = this.initialPosition.y + (this.targetPosition.y - this.initialPosition.y) * easeOutQuad;
      
      // Animate arms for dive
      const armRotation = Math.PI * 0.5 * easeOutQuad;
      
      if (this.diveDirection.x < 0) {
        // Diving to the left
        this.leftArm.rotation.z = -armRotation;
        this.rightArm.rotation.z = -armRotation * 0.5;
        // Rotate legs for more realistic dive
        this.leftLeg.rotation.z = -armRotation * 0.3;
        this.rightLeg.rotation.z = -armRotation * 0.7;
      } else {
        // Diving to the right
        this.leftArm.rotation.z = armRotation * 0.5;
        this.rightArm.rotation.z = armRotation;
        // Rotate legs for more realistic dive
        this.leftLeg.rotation.z = armRotation * 0.7;
        this.rightLeg.rotation.z = armRotation * 0.3;
      }
      
      // Rotate body during dive
      this.group.rotation.z = this.diveDirection.x * Math.PI * 0.25 * easeOutQuad;
      
      // Forward movement based on dive direction
      if (this.diveDirection.y < 0) {
        // Diving low - move forward
        this.group.position.z = this.initialPosition.z + Math.abs(this.diveDirection.y) * 1.5 * easeOutQuad;
      }
    } else {
      // Idle animation and anticipation
      const currentTime = Date.now();
      
      // Update anticipation every 2 seconds
      if (currentTime - this.lastMovementTime > 2000) {
        this.lastMovementTime = currentTime;
        
        // Higher difficulty means more movement and anticipation
        if (Math.random() < this.difficulty / 200) { // 0-50% chance based on difficulty
          this.isAnticipating = true;
          this.anticipationAmount = (Math.random() * 2 - 1) * (this.difficulty / 100);
        } else {
          this.isAnticipating = false;
          this.anticipationAmount = 0;
        }
      }
      
      // Base idle movement
      const idleMovement = Math.sin(Date.now() * 0.001) * 0.2;
      
      // Add anticipation movement if active
      let totalMovement = idleMovement;
      if (this.isAnticipating) {
        totalMovement += this.anticipationAmount;
      }
      
      // Apply movement with constraints
      this.group.position.x = Math.max(-2.5, Math.min(2.5, this.initialPosition.x + totalMovement));
      
      // Subtle up and down movement
      this.group.position.y = this.initialPosition.y + Math.sin(Date.now() * 0.0015) * 0.05;
      
      // Subtle arm movements while idle
      const armIdleAmount = Math.sin(Date.now() * 0.002) * 0.1;
      this.leftArm.rotation.z = armIdleAmount;
      this.rightArm.rotation.z = -armIdleAmount;
      
      // Keeper leans slightly in anticipation direction
      if (this.isAnticipating) {
        this.group.rotation.z = -this.anticipationAmount * 0.1;
      } else {
        this.group.rotation.z *= 0.95; // Gradually return to upright
      }
    }
  }
  
  // Dive in a direction to save the ball
  dive(ballDirection) {
    if (this.isDiving) return;
    
    this.isDiving = true;
    this.diveProgress = 0;
    
    // If we're in player goalkeeper mode, use the input direction
    if (this.isPlayerControlled) {
      this.diveDirection = { ...ballDirection };
    } else {
      // AI goalkeeper: calculate dive direction based on difficulty and ball direction
      const aiAccuracy = this.difficulty / 100; // Higher difficulty = more accurate prediction
      
      // Either predict correctly or make a mistake based on difficulty
      if (Math.random() < aiAccuracy) {
        // Correct guess with some random variation based on difficulty
        const randomVariation = (1 - aiAccuracy) * 0.8; // Less variation at higher difficulty
        this.diveDirection = {
          x: ballDirection.x + (Math.random() * 2 - 1) * randomVariation,
          y: ballDirection.y + (Math.random() * 1 - 0.5) * randomVariation
        };
      } else {
        // Incorrect guess - dive to the wrong direction
        const wrongDirectionX = -ballDirection.x + (Math.random() * 1 - 0.5) * 0.5;
        this.diveDirection = {
          x: wrongDirectionX,
          y: Math.max(0, ballDirection.y + (Math.random() * 0.4 - 0.6))
        };
      }
    }
    
    // Normalize direction to avoid excessively large values
    const length = Math.sqrt(this.diveDirection.x * this.diveDirection.x + this.diveDirection.y * this.diveDirection.y);
    if (length > 1) {
      this.diveDirection.x /= length;
      this.diveDirection.y /= length;
    }
    
    // Calculate dive distance based on difficulty (higher difficulty = farther dives)
    const baseDiveDistance = 2.5;
    const difficultyBonus = this.difficulty / 100 * 1.5;
    const diveDistance = baseDiveDistance + difficultyBonus;
    
    // Calculate target position based on dive direction
    this.targetPosition = {
      x: this.initialPosition.x + this.diveDirection.x * diveDistance,
      y: Math.max(0.5, this.initialPosition.y + this.diveDirection.y * 1.5), // Don't go below ground
      z: this.initialPosition.z
    };
  }
  
  // Track a moving ball and adjust position before diving
  trackBall(ballPosition) {
    if (!this.isDiving && !this.isPlayerControlled) {
      // Only track if not already diving and AI-controlled
      const trackingAmount = Math.min(0.05, this.difficulty / 1000); // Small tracking based on difficulty
      
      // Move slightly toward ball's x position
      const currentX = this.group.position.x;
      const targetX = Math.max(-2.5, Math.min(2.5, ballPosition.x * 0.2)); // Limit movement range
      
      // Move towards target but don't overshoot
      this.group.position.x += (targetX - currentX) * trackingAmount;
    }
  }
  
  // Reset goalkeeper to starting position
  reset() {
    this.group.position.set(
      this.initialPosition.x,
      this.initialPosition.y,
      this.initialPosition.z
    );
    this.group.rotation.set(0, 0, 0);
    this.leftArm.rotation.set(0, 0, 0);
    this.rightArm.rotation.set(0, 0, 0);
    this.leftLeg.rotation.set(0, 0, 0);
    this.rightLeg.rotation.set(0, 0, 0);
    this.isDiving = false;
    this.diveProgress = 0;
    this.isAnticipating = false;
    this.anticipationAmount = 0;
  }
  
  // Set difficulty level
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.reflexModifier = difficulty / 100;
    // Update dive speed with new difficulty
    this.diveSpeed = 0.05 * (1 + (difficulty / 200)); // 0.05 to 0.075 based on difficulty
  }
  
  // Set player control mode
  setPlayerControlled(isPlayerControlled) {
    this.isPlayerControlled = isPlayerControlled;
  }
  
  // Get current position
  getPosition() {
    return this.group.position;
  }
  
  // Check if the goalkeeper is currently diving
  isCurrentlyDiving() {
    return this.isDiving;
  }
  
  // Clean up
  dispose() {
    this.group.traverse((object) => {
      if (object.isMesh) {
        object.material.dispose();
        object.geometry.dispose();
      }
    });
  }
} 