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
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-this.width * 0.13, -this.height * 0.15, 0);
    this.group.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(this.width * 0.13, -this.height * 0.15, 0);
    this.group.add(rightLeg);
    
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
      this.diveProgress += this.diveSpeed;
      
      if (this.diveProgress >= 1) {
        this.diveProgress = 1;
      }
      
      // Calculate current position based on dive progress
      const easeOutQuad = 1 - Math.pow(1 - this.diveProgress, 2);
      this.group.position.x = this.initialPosition.x + (this.targetPosition.x - this.initialPosition.x) * easeOutQuad;
      this.group.position.y = this.initialPosition.y + (this.targetPosition.y - this.initialPosition.y) * easeOutQuad;
      
      // Animate arms for dive
      const armRotation = Math.PI * 0.5 * easeOutQuad;
      
      if (this.diveDirection.x < 0) {
        // Diving to the left
        this.leftArm.rotation.z = -armRotation;
        this.rightArm.rotation.z = -armRotation * 0.5;
      } else {
        // Diving to the right
        this.leftArm.rotation.z = armRotation * 0.5;
        this.rightArm.rotation.z = armRotation;
      }
      
      // Rotate body during dive
      this.group.rotation.z = this.diveDirection.x * Math.PI * 0.25 * easeOutQuad;
    } else {
      // Idle animation - slight movement side to side
      const idleMovement = Math.sin(Date.now() * 0.001) * 0.2;
      this.group.position.x = this.initialPosition.x + idleMovement;
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
      this.diveDirection = getGoalkeeperDiveDirection(ballDirection, this.difficulty);
    }
    
    // Calculate target position based on dive direction
    const diveDistance = 2.5; // How far to dive
    this.targetPosition = {
      x: this.initialPosition.x + this.diveDirection.x * diveDistance,
      y: Math.max(0.5, this.initialPosition.y + this.diveDirection.y * 1.5), // Don't go below ground
      z: this.initialPosition.z
    };
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
    this.isDiving = false;
    this.diveProgress = 0;
  }
  
  // Set difficulty level
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
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