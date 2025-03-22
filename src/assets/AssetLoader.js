import * as THREE from 'three';

// Asset storage
const assets = {
  textures: {},
  models: {},
  flags: {},
  audio: {}
};

// Countries and their respective flags
const countries = [
  { code: 'br', name: 'Brazil' },
  { code: 'ar', name: 'Argentina' },
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
  { code: 'gb', name: 'England' },
  { code: 'pt', name: 'Portugal' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'be', name: 'Belgium' }
];

// Load all game assets
export async function loadAssets() {
  try {
    const textureLoader = new THREE.TextureLoader();
    
    // Create dummy flag textures for now (we'll use real flags later)
    // In a production game, we would load real flag images
    await Promise.all(countries.map(async (country) => {
      // For now, create colored rectangles as placeholder flags
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      
      // Different color for each country (just for demonstration)
      const colors = {
        'br': ['#009c3b', '#ffdf00', '#002776'],
        'ar': ['#74acdf', '#ffffff', '#74acdf'],
        'fr': ['#002395', '#ffffff', '#ed2939'],
        'de': ['#000000', '#dd0000', '#ffce00'],
        'es': ['#aa151b', '#f1bf00', '#aa151b'],
        'it': ['#009246', '#ffffff', '#ce2b37'],
        'gb': ['#012169', '#ffffff', '#c8102e'],
        'pt': ['#006600', '#ff0000', '#006600'],
        'nl': ['#ae1c28', '#ffffff', '#21468b'],
        'be': ['#000000', '#fdda25', '#ef3340']
      };
      
      const countryColors = colors[country.code] || ['#dddddd', '#aaaaaa', '#555555'];
      
      // Draw a simple flag with three vertical bars
      ctx.fillStyle = countryColors[0];
      ctx.fillRect(0, 0, canvas.width/3, canvas.height);
      ctx.fillStyle = countryColors[1];
      ctx.fillRect(canvas.width/3, 0, canvas.width/3, canvas.height);
      ctx.fillStyle = countryColors[2];
      ctx.fillRect(2*canvas.width/3, 0, canvas.width/3, canvas.height);
      
      // Convert canvas to data URL and create texture
      const texture = new THREE.CanvasTexture(canvas);
      assets.flags[country.code] = {
        texture: texture,
        name: country.name
      };
    }));
    
    // Load stadium grass texture
    assets.textures.grass = await new Promise((resolve, reject) => {
      textureLoader.load(
        // Create a simple green texture for grass
        createGrassTexture(),
        (texture) => resolve(texture),
        undefined,
        (err) => reject(err)
      );
    });
    
    // Load soccer ball texture
    assets.textures.ball = await new Promise((resolve, reject) => {
      textureLoader.load(
        // Create a simple soccer ball texture
        createSoccerBallTexture(),
        (texture) => resolve(texture),
        undefined,
        (err) => reject(err)
      );
    });
    
    return assets;
  } catch (error) {
    console.error('Error loading assets:', error);
    throw error;
  }
}

// Helper function to create a simple grass texture
function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base green color
  ctx.fillStyle = '#2e8b57';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some grass pattern
  ctx.fillStyle = '#228b22';
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 2 + Math.random() * 4;
    ctx.fillRect(x, y, size, size);
  }
  
  // Add some darker spots
  ctx.fillStyle = '#006400';
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 4 + Math.random() * 8;
    ctx.fillRect(x, y, size, size);
  }
  
  return canvas.toDataURL();
}

// Helper function to create a simple soccer ball texture
function createSoccerBallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw some black pentagons
  ctx.fillStyle = '#000000';
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width * 0.4;
  
  // Draw a few black polygons to mimic a soccer ball pattern
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const x = centerX + Math.cos(angle) * radius * 0.6;
    const y = centerY + Math.sin(angle) * radius * 0.6;
    
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const pointAngle = angle + (Math.PI * 2 * j) / 5;
      const pointX = x + Math.cos(pointAngle) * radius * 0.2;
      const pointY = y + Math.sin(pointAngle) * radius * 0.2;
      if (j === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
  
  return canvas.toDataURL();
}

// Export the assets and countries
export { assets, countries }; 