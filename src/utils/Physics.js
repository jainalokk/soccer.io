import * as THREE from 'three';

// Calculate trajectory of a kicked ball
export function calculateBallTrajectory(direction, power, difficulty) {
  // Initial velocity based on power (0-1) and direction
  const initialVelocity = {
    x: direction.x * power * 50, // Horizontal component
    y: Math.max(0.3, direction.y) * power * 40, // Vertical component (ensure some lift)
    z: -power * 70 // Forward component (negative z is forward in Three.js)
  };
  
  // Add some randomness based on difficulty (less randomness at higher difficulty)
  // At lower difficulty, shots are more predictable
  const randomFactor = (100 - difficulty) / 100;
  initialVelocity.x += (Math.random() * 2 - 1) * randomFactor * 15;
  initialVelocity.y += (Math.random() * randomFactor) * 10;
  
  return initialVelocity;
}

// Update ball position with physics
export function updateBallPhysics(ball, velocity, deltaTime) {
  // Apply gravity to y-component
  velocity.y -= 9.8 * deltaTime; // Gravity acceleration
  
  // Apply drag to slow the ball over time
  const drag = 0.99;
  velocity.x *= drag;
  velocity.z *= drag;
  
  // Update position
  ball.position.x += velocity.x * deltaTime;
  ball.position.y += velocity.y * deltaTime;
  ball.position.z += velocity.z * deltaTime;
  
  // Don't let the ball go below the ground
  if (ball.position.y < ball.geometry.parameters.radius) {
    ball.position.y = ball.geometry.parameters.radius;
    
    // Bounce with energy loss
    if (Math.abs(velocity.y) > 0.1) {
      velocity.y = -velocity.y * 0.6; // Bounce with 60% energy
    } else {
      velocity.y = 0; // Stop bouncing if too slow
    }
  }
  
  // Add spin to the ball based on velocity
  const speed = Math.sqrt(
    velocity.x * velocity.x + 
    velocity.y * velocity.y + 
    velocity.z * velocity.z
  );
  
  // Rotate the ball based on its movement direction and speed
  if (speed > 0.1) {
    // Calculate rotation axis (perpendicular to velocity)
    const rotationAxis = new THREE.Vector3(-velocity.z, 0, velocity.x).normalize();
    const rotationAmount = speed * deltaTime * 0.2;
    
    // Apply rotation
    ball.rotateOnWorldAxis(rotationAxis, rotationAmount);
  }
  
  return velocity;
}

// Check if the ball is in the goal
export function checkGoal(ball, goalBounds) {
  // Goal posts and crossbar positions
  const { left, right, top, back } = goalBounds;
  
  // Check if the ball is between the goal posts, below the crossbar, and past the goal line
  return (
    ball.position.x > left &&
    ball.position.x < right &&
    ball.position.y < top &&
    ball.position.z < back
  );
}

// Check if goalkeeper saved the ball
export function checkSave(ball, goalkeeper, difficulty) {
  // Simplified collision detection - just check distance
  const distance = ball.position.distanceTo(goalkeeper.position);
  
  // Goalkeeper's reaching radius (larger for easier difficulty)
  const savingRadius = 3 + (100 - difficulty) / 20;
  
  return distance < savingRadius;
}

// Choose random goalkeeper dive direction based on difficulty
export function getGoalkeeperDiveDirection(ballDirection, difficulty) {
  // Higher difficulty means more accurate prediction
  const accuracyFactor = difficulty / 100;
  
  // Chance to dive in the correct direction
  if (Math.random() < accuracyFactor) {
    // Correct guess with some random variation
    return {
      x: ballDirection.x + (Math.random() * 0.6 - 0.3),
      y: ballDirection.y + (Math.random() * 0.4 - 0.2)
    };
  } else {
    // Wrong guess
    return {
      x: -ballDirection.x + (Math.random() * 0.6 - 0.3),
      y: Math.random() > 0.5 ? 0.2 : -0.2
    };
  }
} 