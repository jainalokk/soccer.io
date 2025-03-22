import * as THREE from 'three';
import { updateBallPhysics } from '../utils/Physics.js';

export class Ball {
  constructor(scene, assets) {
    // Ball properties
    this.radius = 0.22; // Standard soccer ball radius in meters
    this.isMoving = false;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.initialPosition = { x: 0, y: this.radius, z: 11 }; // Just in front of the penalty spot
    
    // Create ball mesh
    this.createBallMesh(scene, assets);
  }
  
  // Create the ball mesh with texture
  createBallMesh(scene, assets) {
    // Create geometry
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    
    // Create material with soccer ball texture
    let material;
    
    if (assets && assets.textures && assets.textures.ball) {
      // Use loaded texture
      material = new THREE.MeshPhongMaterial({ map: assets.textures.ball });
    } else {
      // Fallback to basic material if texture not available
      material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        emissive: 0x111111
      });
      
      // Add a simple pattern to make it look like a soccer ball
      this.addSoccerBallPattern(material);
    }
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Set initial position
    this.reset();
    
    // Add to scene
    scene.add(this.mesh);
  }
  
  // Add a simple pattern to make the ball look like a soccer ball
  addSoccerBallPattern(material) {
    // Create a canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Fill with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black pentagons
    ctx.fillStyle = '#000000';
    
    // Draw a few black spots in a pattern
    for (let i = 0; i < 6; i++) {
      const x = 256 + Math.cos(i * Math.PI / 3) * 150;
      const y = 256 + Math.sin(i * Math.PI / 3) * 150;
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    material.map = texture;
    material.needsUpdate = true;
  }
  
  // Update ball position and physics
  update(deltaTime) {
    if (this.isMoving) {
      // Apply physics to update velocity and position
      this.velocity = updateBallPhysics(this.mesh, this.velocity, deltaTime);
      
      // Check if the ball has stopped moving
      const speed = Math.sqrt(
        this.velocity.x * this.velocity.x +
        this.velocity.y * this.velocity.y +
        this.velocity.z * this.velocity.z
      );
      
      if (speed < 0.1) {
        this.velocity = { x: 0, y: 0, z: 0 };
        this.isMoving = false;
      }
    }
  }
  
  // Kick the ball with given direction and power
  kick(direction, power, difficulty) {
    // Set ball in motion
    this.isMoving = true;
    
    // Initial velocity based on power (0-1) and direction
    this.velocity = {
      x: direction.x * power * 50, // Horizontal component
      y: Math.max(0.3, direction.y) * power * 40, // Vertical component (ensure some lift)
      z: -power * 70 // Forward component (negative z is forward in Three.js)
    };
    
    // Add some randomness based on difficulty (less randomness at higher difficulty)
    const randomFactor = (100 - difficulty) / 100;
    this.velocity.x += (Math.random() * 2 - 1) * randomFactor * 15;
    this.velocity.y += (Math.random() * randomFactor) * 10;
  }
  
  // Reset ball to starting position
  reset() {
    this.mesh.position.set(
      this.initialPosition.x,
      this.initialPosition.y,
      this.initialPosition.z
    );
    this.velocity = { x: 0, y: 0, z: 0 };
    this.isMoving = false;
    this.mesh.rotation.set(0, 0, 0);
  }
  
  // Get current position
  getPosition() {
    return this.mesh.position;
  }
  
  // Clean up
  dispose() {
    if (this.mesh.material.map) {
      this.mesh.material.map.dispose();
    }
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
  }
} 