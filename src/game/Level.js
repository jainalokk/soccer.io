import * as THREE from 'three';

export class Level {
  constructor(scene, assets) {
    // Level dimensions
    this.fieldWidth = 40;
    this.fieldLength = 60;
    this.fieldDepth = 0.1;
    
    // Goal dimensions (standard soccer goal is about 7.32m × 2.44m)
    this.goalWidth = 7.32;
    this.goalHeight = 2.44;
    this.goalDepth = 2;
    this.goalPostThickness = 0.12;
    
    // Create the field and stadium
    this.createField(scene, assets);
    this.createGoal(scene);
    this.createStadium(scene);
    
    // Add ambient and directional light
    this.createLights(scene);
  }
  
  // Create the soccer field
  createField(scene, assets) {
    // Create field geometry
    const geometry = new THREE.BoxGeometry(this.fieldWidth, this.fieldDepth, this.fieldLength);
    
    // Create field material with grass texture
    let material;
    
    if (assets && assets.textures && assets.textures.grass) {
      material = new THREE.MeshPhongMaterial({ map: assets.textures.grass });
      
      // Make the texture repeat to show more grass detail
      assets.textures.grass.wrapS = THREE.RepeatWrapping;
      assets.textures.grass.wrapT = THREE.RepeatWrapping;
      assets.textures.grass.repeat.set(10, 15);
    } else {
      // Fallback to basic green material
      material = new THREE.MeshPhongMaterial({ color: 0x2e8b57 });
    }
    
    // Create field mesh
    this.field = new THREE.Mesh(geometry, material);
    this.field.receiveShadow = true;
    
    // Position field at ground level
    this.field.position.y = -this.fieldDepth / 2;
    
    // Add field to scene
    scene.add(this.field);
    
    // Add field markings
    this.addFieldMarkings(scene);
  }
  
  // Add penalty area and other field markings
  addFieldMarkings(scene) {
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Penalty area (16.5m from goal line, 40.3m wide)
    const penaltyAreaWidth = 16.5;
    const penaltyAreaLength = 40.3;
    const lineThickness = 0.1;
    const lineHeight = 0.01;
    
    // Penalty spot (11m from goal line)
    const penaltySpotGeometry = new THREE.CircleGeometry(0.2, 16);
    const penaltySpot = new THREE.Mesh(penaltySpotGeometry, lineMaterial);
    penaltySpot.rotation.x = -Math.PI / 2;
    penaltySpot.position.set(0, 0.01, 11);
    scene.add(penaltySpot);
    
    // Penalty area lines
    const createLine = (width, depth, x, z) => {
      const lineGeometry = new THREE.BoxGeometry(width, lineHeight, depth);
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(x, lineHeight / 2, z);
      scene.add(line);
    };
    
    // Penalty area width lines
    createLine(penaltyAreaLength, lineThickness, 0, -penaltyAreaWidth);
    
    // Penalty area depth lines
    createLine(lineThickness, penaltyAreaWidth, -penaltyAreaLength/2, -penaltyAreaWidth/2);
    createLine(lineThickness, penaltyAreaWidth, penaltyAreaLength/2, -penaltyAreaWidth/2);
    
    // Goal line
    createLine(this.goalWidth + 4, lineThickness, 0, 0);
  }
  
  // Create the goal
  createGoal(scene) {
    // Goal post material
    const goalPostMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    // Goal net material - slightly transparent white
    const goalNetMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.4,
      side: THREE.DoubleSide,
      wireframe: true
    });
    
    // Create goal posts
    
    // Crossbar
    const crossbarGeometry = new THREE.BoxGeometry(this.goalWidth, this.goalPostThickness, this.goalPostThickness);
    const crossbar = new THREE.Mesh(crossbarGeometry, goalPostMaterial);
    crossbar.position.set(0, this.goalHeight, 0);
    crossbar.castShadow = true;
    
    // Left post
    const leftPostGeometry = new THREE.BoxGeometry(this.goalPostThickness, this.goalHeight, this.goalPostThickness);
    const leftPost = new THREE.Mesh(leftPostGeometry, goalPostMaterial);
    leftPost.position.set(-this.goalWidth/2, this.goalHeight/2, 0);
    leftPost.castShadow = true;
    
    // Right post
    const rightPostGeometry = new THREE.BoxGeometry(this.goalPostThickness, this.goalHeight, this.goalPostThickness);
    const rightPost = new THREE.Mesh(rightPostGeometry, goalPostMaterial);
    rightPost.position.set(this.goalWidth/2, this.goalHeight/2, 0);
    rightPost.castShadow = true;
    
    // Goal group
    this.goal = new THREE.Group();
    this.goal.add(crossbar);
    this.goal.add(leftPost);
    this.goal.add(rightPost);
    
    // Goal nets
    
    // Back net
    const backNetGeometry = new THREE.PlaneGeometry(this.goalWidth, this.goalHeight);
    const backNet = new THREE.Mesh(backNetGeometry, goalNetMaterial);
    backNet.position.set(0, this.goalHeight/2, -this.goalDepth);
    
    // Left side net
    const leftSideNetGeometry = new THREE.PlaneGeometry(this.goalDepth, this.goalHeight);
    const leftSideNet = new THREE.Mesh(leftSideNetGeometry, goalNetMaterial);
    leftSideNet.rotation.y = Math.PI / 2;
    leftSideNet.position.set(-this.goalWidth/2, this.goalHeight/2, -this.goalDepth/2);
    
    // Right side net
    const rightSideNetGeometry = new THREE.PlaneGeometry(this.goalDepth, this.goalHeight);
    const rightSideNet = new THREE.Mesh(rightSideNetGeometry, goalNetMaterial);
    rightSideNet.rotation.y = -Math.PI / 2;
    rightSideNet.position.set(this.goalWidth/2, this.goalHeight/2, -this.goalDepth/2);
    
    // Top net
    const topNetGeometry = new THREE.PlaneGeometry(this.goalWidth, this.goalDepth);
    const topNet = new THREE.Mesh(topNetGeometry, goalNetMaterial);
    topNet.rotation.x = Math.PI / 2;
    topNet.position.set(0, this.goalHeight, -this.goalDepth/2);
    
    // Add nets to goal
    this.goal.add(backNet);
    this.goal.add(leftSideNet);
    this.goal.add(rightSideNet);
    this.goal.add(topNet);
    
    // Add goal to scene
    scene.add(this.goal);
    
    // Store goal bounds for collision detection
    this.goalBounds = {
      left: -this.goalWidth / 2,
      right: this.goalWidth / 2,
      top: this.goalHeight,
      back: -this.goalDepth
    };
  }
  
  // Create a simple stadium around the field
  createStadium(scene) {
    // Create a simple stadium enclosure
    const stadiumDepth = 20;
    const stadiumHeight = 15;
    
    // Stadium material - darker color for contrast
    const stadiumMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    // Stadium walls (4 sides)
    const stadiumWalls = [
      // Back wall (behind goal)
      { width: this.fieldWidth * 1.5, height: stadiumHeight, depth: 1, x: 0, y: stadiumHeight/2, z: -this.fieldLength/2 - stadiumDepth/2 },
      // Front wall (behind player)
      { width: this.fieldWidth * 1.5, height: stadiumHeight, depth: 1, x: 0, y: stadiumHeight/2, z: this.fieldLength/2 + stadiumDepth/2 },
      // Left wall
      { width: 1, height: stadiumHeight, depth: this.fieldLength + stadiumDepth, x: -this.fieldWidth/2 - stadiumDepth/2, y: stadiumHeight/2, z: 0 },
      // Right wall
      { width: 1, height: stadiumHeight, depth: this.fieldLength + stadiumDepth, x: this.fieldWidth/2 + stadiumDepth/2, y: stadiumHeight/2, z: 0 }
    ];
    
    // Create and add walls
    stadiumWalls.forEach(wall => {
      const geometry = new THREE.BoxGeometry(wall.width, wall.height, wall.depth);
      const mesh = new THREE.Mesh(geometry, stadiumMaterial);
      mesh.position.set(wall.x, wall.y, wall.z);
      scene.add(mesh);
    });
    
    // Add a simple skybox
    this.createSkybox(scene);
  }
  
  // Create a simple skybox
  createSkybox(scene) {
    const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
    const skyboxMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // Sky blue
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide })
    ];
    
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
    scene.add(skybox);
  }
  
  // Create lights for the scene
  createLights(scene) {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    
    // Adjust shadow properties for better quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    
    // Adjust shadow camera frustum
    const shadowSize = 50;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(directionalLight);
    
    // Additional light from the front to reduce harsh shadows
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.3);
    frontLight.position.set(0, 10, 100);
    scene.add(frontLight);
  }
  
  // Get goal bounds for collision detection
  getGoalBounds() {
    return this.goalBounds;
  }
  
  // Clean up resources
  dispose() {
    // Dispose of geometry and materials
    this.field.geometry.dispose();
    this.field.material.dispose();
    
    // Dispose of goal group
    this.goal.traverse((object) => {
      if (object.isMesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
  }
} 