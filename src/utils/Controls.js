// Controls class to handle keyboard input
export class Controls {
  constructor() {
    // Key states
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false
    };
    
    // Direction and power
    this.direction = { x: 0, y: 0 };
    this.power = 0;
    this.powerDirection = 1; // 1 for increasing, -1 for decreasing
    this.isPowerActive = false;
    
    // Callbacks
    this.onShoot = null;
    
    // Bind methods
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    
    // Initialize event listeners
    this._initEventListeners();
  }
  
  // Initialize event listeners
  _initEventListeners() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }
  
  // Remove event listeners
  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
  
  // Handle keydown events
  _onKeyDown(event) {
    switch(event.code) {
      case 'ArrowUp':
        this.keys.ArrowUp = true;
        break;
      case 'ArrowDown':
        this.keys.ArrowDown = true;
        break;
      case 'ArrowLeft':
        this.keys.ArrowLeft = true;
        break;
      case 'ArrowRight':
        this.keys.ArrowRight = true;
        break;
      case 'Space':
        if (!this.keys.Space) {
          this.keys.Space = true;
          this.startPowerBar();
        }
        break;
    }
    
    this.updateDirection();
  }
  
  // Handle keyup events
  _onKeyUp(event) {
    switch(event.code) {
      case 'ArrowUp':
        this.keys.ArrowUp = false;
        break;
      case 'ArrowDown':
        this.keys.ArrowDown = false;
        break;
      case 'ArrowLeft':
        this.keys.ArrowLeft = false;
        break;
      case 'ArrowRight':
        this.keys.ArrowRight = false;
        break;
      case 'Space':
        if (this.keys.Space) {
          this.keys.Space = false;
          this.shoot();
        }
        break;
    }
    
    this.updateDirection();
  }
  
  // Update direction based on keys pressed
  updateDirection() {
    this.direction.x = 0;
    this.direction.y = 0;
    
    if (this.keys.ArrowLeft) this.direction.x -= 1;
    if (this.keys.ArrowRight) this.direction.x += 1;
    if (this.keys.ArrowUp) this.direction.y += 1;
    if (this.keys.ArrowDown) this.direction.y -= 1;
    
    // Normalize direction vector if moving diagonally
    if (this.direction.x !== 0 && this.direction.y !== 0) {
      const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
      this.direction.x /= length;
      this.direction.y /= length;
    }
  }
  
  // Start the power bar animation
  startPowerBar() {
    if (this.isPowerActive) return;
    
    this.isPowerActive = true;
    this.power = 0;
    this.powerDirection = 1;
    
    // Start power bar animation
    this._updatePowerBar();
  }
  
  // Update power bar
  _updatePowerBar() {
    if (!this.isPowerActive) return;
    
    // Increase/decrease power based on direction
    this.power += 0.02 * this.powerDirection;
    
    // Reverse direction at boundaries
    if (this.power >= 1) {
      this.power = 1;
      this.powerDirection = -1;
    } else if (this.power <= 0) {
      this.power = 0;
      this.powerDirection = 1;
    }
    
    // Continue animation if active
    if (this.isPowerActive) {
      requestAnimationFrame(() => this._updatePowerBar());
    }
  }
  
  // Shoot with current direction and power
  shoot() {
    this.isPowerActive = false;
    
    if (this.onShoot) {
      this.onShoot({
        direction: { ...this.direction },
        power: this.power
      });
    }
    
    // Reset power
    this.power = 0;
  }
  
  // Set shoot callback
  setShootCallback(callback) {
    this.onShoot = callback;
  }
} 