import * as THREE from 'three';
import { Controls } from '../utils/Controls.js';

export class Player {
  constructor(scene, country) {
    // Player properties
    this.width = 1.8; // Player width
    this.height = 1.8; // Player height
    this.depth = 0.4; // Player depth
    this.country = country;
    this.runUpProgress = 0;
    this.isRunningUp = false;
    this.runUpSpeed = 0.02;
    this.initialPosition = { x: 0, y: 0.9, z: 16 }; // Behind the penalty spot
    
    // Controls for player input
    this.controls = new Controls();
    
    // Create player mesh
    this.createPlayerMesh(scene);
    
    // Setup shoot callback
    this.setupShootCallback();
  }
  
  // Create the player mesh
  createPlayerMesh(scene) {
    // Create simplified player using group of meshes
    this.group = new THREE.Group();
    
    // Player body
    const bodyGeometry = new THREE.BoxGeometry(this.width * 0.4, this.height * 0.5, this.depth);
    
    // Choose jersey color based on country
    const jerseyColors = {
      'br': 0xF9DD16, // Brazil (yellow)
      'ar': 0x75AADB, // Argentina (light blue)
      'fr': 0x002654, // France (blue)
      'de': 0xFFFFFF, // Germany (white)
      'es': 0xFF0000, // Spain (red)
      'it': 0x0066CC, // Italy (blue)
      'gb': 0xFFFFFF, // England (white)
      'pt': 0xFF0000, // Portugal (red)
      'nl': 0xFF7800, // Netherlands (orange)
      'be': 0xFF0000  // Belgium (red)
    };
    
    const jerseyColor = jerseyColors[this.country] || 0x0000FF;
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: jerseyColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = this.height * 0.25;
    this.group.add(body);
    
    // Player head
    const headGeometry = new THREE.SphereGeometry(this.height * 0.15, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac }); // Skin color
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = this.height * 0.58;
    this.group.add(head);
    
    // Player legs
    const legGeometry = new THREE.BoxGeometry(this.width * 0.15, this.height * 0.45, this.depth);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 }); // Dark shorts color
    
    // Left leg
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(-this.width * 0.12, -this.height * 0.125, 0);
    this.group.add(this.leftLeg);
    
    // Right leg
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(this.width * 0.12, -this.height * 0.125, 0);
    this.group.add(this.rightLeg);
    
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
    
    // Create directional indicator arrow
    this.createDirectionalArrow(scene);
  }
  
  // Create an arrow to show kick direction
  createDirectionalArrow(scene) {
    // Create arrow geometry
    const arrowLength = 2;
    const arrowHeadHeight = 0.5;
    const arrowWidth = 0.1;
    
    // Arrow body
    const arrowBodyGeometry = new THREE.BoxGeometry(arrowWidth, arrowWidth, arrowLength - arrowHeadHeight);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.arrowBody = new THREE.Mesh(arrowBodyGeometry, arrowMaterial);
    this.arrowBody.position.z = -(arrowLength - arrowHeadHeight) / 2;
    
    // Arrow head
    const arrowHeadGeometry = new THREE.ConeGeometry(arrowWidth * 3, arrowHeadHeight, 8);
    this.arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
    this.arrowHead.rotation.x = Math.PI / 2;
    this.arrowHead.position.z = -arrowLength + arrowHeadHeight/2;
    
    // Arrow group
    this.arrow = new THREE.Group();
    this.arrow.add(this.arrowBody);
    this.arrow.add(this.arrowHead);
    
    // Position at the ball height
    this.arrow.position.y = 0.22;
    
    // Initially hidden
    this.arrow.visible = false;
    
    // Add to scene
    scene.add(this.arrow);
  }
  
  // Setup player control callbacks
  setupShootCallback() {
    this.controls.setShootCallback(({ direction, power }) => {
      if (this.onShoot) {
        // Start the run-up animation
        this.startRunUp(() => {
          // Call the shoot callback once the run-up is complete
          this.onShoot(direction, power);
        });
      }
    });
  }
  
  // Start the run-up animation
  startRunUp(callback) {
    if (this.isRunningUp) return;
    
    this.isRunningUp = true;
    this.runUpProgress = 0;
    this.runUpCallback = callback;
  }
  
  // Update player position and animation
  update(deltaTime) {
    // Update directional arrow based on controls
    if (this.arrow && !this.isRunningUp) {
      const direction = this.controls.direction;
      
      // Only show arrow if a direction is being pressed
      this.arrow.visible = (direction.x !== 0 || direction.y !== 0);
      
      if (this.arrow.visible) {
        // Position the arrow at the ball
        this.arrow.position.x = 0;
        this.arrow.position.z = 11;
        
        // Calculate rotation based on direction
        const angle = Math.atan2(direction.x, direction.y);
        this.arrow.rotation.y = angle;
        
        // Visualize power if space is being held
        if (this.controls.isPowerActive) {
          // Scale the arrow based on power
          const scale = 0.5 + this.controls.power * 2.5;
          this.arrow.scale.set(scale, scale, scale);
          
          // Change color based on power
          const hue = this.controls.power * 120; // 0 = red, 60 = yellow, 120 = green
          const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
          this.arrowBody.material.color = color;
          this.arrowHead.material.color = color;
        } else {
          // Reset arrow scale
          this.arrow.scale.set(1, 1, 1);
          // Reset arrow color
          const color = new THREE.Color(0xffff00);
          this.arrowBody.material.color = color;
          this.arrowHead.material.color = color;
        }
      }
    }
    
    // Handle run-up animation
    if (this.isRunningUp) {
      this.runUpProgress += this.runUpSpeed;
      
      if (this.runUpProgress >= 1) {
        this.runUpProgress = 1;
        this.isRunningUp = false;
        
        if (this.runUpCallback) {
          this.runUpCallback();
          this.runUpCallback = null;
        }
      }
      
      // Move player towards the ball
      const startX = this.initialPosition.x;
      const startZ = this.initialPosition.z;
      const targetZ = 12; // Just behind the ball
      
      // Use easing function for smooth acceleration
      const easeInOutQuad = this.runUpProgress < 0.5
        ? 2 * this.runUpProgress * this.runUpProgress
        : 1 - Math.pow(-2 * this.runUpProgress + 2, 2) / 2;
      
      this.group.position.z = startZ - (startZ - targetZ) * easeInOutQuad;
      
      // Animate legs during run-up
      const legSwing = Math.sin(this.runUpProgress * Math.PI * 6) * 0.8;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
    } else {
      // Idle animation - slight leg movement
      const idleMovement = Math.sin(Date.now() * 0.002) * 0.1;
      this.leftLeg.rotation.x = idleMovement;
      this.rightLeg.rotation.x = -idleMovement;
    }
  }
  
  // Reset player to starting position
  reset() {
    this.group.position.set(
      this.initialPosition.x,
      this.initialPosition.y,
      this.initialPosition.z
    );
    this.group.rotation.set(0, 0, 0);
    this.leftLeg.rotation.set(0, 0, 0);
    this.rightLeg.rotation.set(0, 0, 0);
    this.isRunningUp = false;
    this.runUpProgress = 0;
    
    if (this.arrow) {
      this.arrow.visible = false;
      this.arrow.scale.set(1, 1, 1);
    }
  }
  
  // Set shoot callback
  setShootCallback(callback) {
    this.onShoot = callback;
  }
  
  // Get player controls
  getControls() {
    return this.controls;
  }
  
  // Clean up
  dispose() {
    this.controls.dispose();
    
    this.group.traverse((object) => {
      if (object.isMesh) {
        object.material.dispose();
        object.geometry.dispose();
      }
    });
    
    if (this.arrow) {
      this.arrowBody.material.dispose();
      this.arrowBody.geometry.dispose();
      this.arrowHead.material.dispose();
      this.arrowHead.geometry.dispose();
    }
  }
} 