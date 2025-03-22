import { countries } from '../assets/AssetLoader.js';

// Initialize the menu with country options
export function setupMenu() {
  // Country selection
  setupCountrySelection();
}

// Setup country selection buttons
function setupCountrySelection() {
  const countrySelection = document.getElementById('country-selection');
  
  // Clear existing content
  countrySelection.innerHTML = '';
  
  // Add country options
  countries.forEach(country => {
    const countryElement = document.createElement('div');
    countryElement.classList.add('country-option');
    countryElement.dataset.country = country.code;
    
    // Create flag element (instead of real images, we'll use CSS with country codes for now)
    const flagElement = document.createElement('div');
    flagElement.classList.add('country-flag');
    
    // We'll use a CSS class based on country code to display the flag
    flagElement.style.background = `url(assets/flags/${country.code}.png) no-repeat center/cover`;
    flagElement.style.backgroundColor = '#ccc'; // Fallback color
    
    // Add title for hover effect
    countryElement.title = country.name;
    
    // Add flag to country option
    countryElement.appendChild(flagElement);
    
    // Add click handler to select country
    countryElement.addEventListener('click', () => {
      // Remove selected class from all countries
      document.querySelectorAll('.country-option').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Add selected class to this country
      countryElement.classList.add('selected');
    });
    
    // Add to country selection container
    countrySelection.appendChild(countryElement);
  });
  
  // Since we don't have real flag images yet, let's create placeholders with colors
  createFlagPlaceholders();
}

// Create colored placeholders for country flags
function createFlagPlaceholders() {
  const countryColors = {
    'br': ['#009c3b', '#ffdf00', '#002776'], // Brazil (green, yellow, blue)
    'ar': ['#74acdf', '#ffffff', '#74acdf'], // Argentina (light blue, white, light blue)
    'fr': ['#002395', '#ffffff', '#ed2939'], // France (blue, white, red)
    'de': ['#000000', '#dd0000', '#ffce00'], // Germany (black, red, gold)
    'es': ['#aa151b', '#f1bf00', '#aa151b'], // Spain (red, yellow, red)
    'it': ['#009246', '#ffffff', '#ce2b37'], // Italy (green, white, red)
    'gb': ['#012169', '#ffffff', '#c8102e'], // UK (blue, white, red)
    'pt': ['#006600', '#ff0000', '#006600'], // Portugal (green, red, green)
    'nl': ['#ae1c28', '#ffffff', '#21468b'], // Netherlands (red, white, blue)
    'be': ['#000000', '#fdda25', '#ef3340']  // Belgium (black, yellow, red)
  };
  
  // Apply colored backgrounds to each flag placeholder
  document.querySelectorAll('.country-option').forEach(option => {
    const countryCode = option.dataset.country;
    const colors = countryColors[countryCode];
    
    if (colors) {
      // Create colored flag with three vertical stripes
      const flagElement = option.querySelector('.country-flag');
      
      // Override the background image
      flagElement.style.background = 'none';
      
      // Set a linear gradient for the three colors
      flagElement.style.background = `linear-gradient(to right, 
        ${colors[0]} 0%, ${colors[0]} 33.3%, 
        ${colors[1]} 33.3%, ${colors[1]} 66.6%, 
        ${colors[2]} 66.6%, ${colors[2]} 100%)`;
    }
  });
} 