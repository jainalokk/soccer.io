import { Game } from './game/Game.js';
import { setupMenu } from './ui/Menu.js';
import { loadAssets } from './assets/AssetLoader.js';

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const difficultySlider = document.getElementById('difficulty-slider');
const difficultyValue = document.getElementById('difficulty-value');
const startGameButton = document.getElementById('start-game');
const backToMenuButton = document.getElementById('back-to-menu');

// Game state
let game = null;
let selectedCountry = null;
let gameMode = 'shoot'; // 'shoot' or 'save'
let difficulty = 1;

// Initialize the application
async function init() {
  // Show loading screen
  loadingScreen.classList.remove('hidden');
  menuScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  
  try {
    // Load game assets
    await loadAssets();
    
    // Setup menu interactions
    setupMenu();
    
    // Add event listeners
    setupEventListeners();
    
    // Hide loading screen and show menu
    loadingScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
  } catch (error) {
    console.error('Failed to initialize the game:', error);
    alert('Failed to load the game. Please refresh the page and try again.');
  }
}

// Setup event listeners for the game
function setupEventListeners() {
  // Update difficulty display
  difficultySlider.addEventListener('input', () => {
    difficulty = parseInt(difficultySlider.value);
    difficultyValue.textContent = difficulty;
  });
  
  // Game mode selection
  document.getElementById('mode-shoot').addEventListener('click', () => {
    document.getElementById('mode-shoot').classList.add('selected');
    document.getElementById('mode-save').classList.remove('selected');
    gameMode = 'shoot';
  });
  
  document.getElementById('mode-save').addEventListener('click', () => {
    document.getElementById('mode-save').classList.add('selected');
    document.getElementById('mode-shoot').classList.remove('selected');
    gameMode = 'save';
  });
  
  // Start game button
  startGameButton.addEventListener('click', startGame);
  
  // Back to menu button
  backToMenuButton.addEventListener('click', () => {
    if (game) {
      game.dispose();
      game = null;
    }
    gameScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
  });
}

// Start the game with current settings
function startGame() {
  // Check if a country is selected
  selectedCountry = document.querySelector('.country-option.selected')?.dataset.country;
  if (!selectedCountry) {
    alert('Please select a country!');
    return;
  }
  
  // Hide menu and show game
  menuScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  
  // Initialize game with current settings
  const gameContainer = document.getElementById('game-container');
  game = new Game({
    container: gameContainer,
    country: selectedCountry,
    mode: gameMode,
    difficulty: difficulty
  });
  
  // Start the game
  game.start();
  
  // Update instructions based on game mode
  const instructions = document.getElementById('instructions');
  if (gameMode === 'shoot') {
    instructions.textContent = 'Use arrow keys to aim, SPACE to shoot.';
  } else {
    instructions.textContent = 'Use arrow keys to dive when the ball is kicked.';
  }
}

// Start the application when the page is loaded
window.addEventListener('load', init);

// Export for potential use in other modules
export { selectedCountry, gameMode, difficulty }; 