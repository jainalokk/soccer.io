# Soccer.io - 3D Penalty Shootout Game

A web-based 3D penalty shootout game built with Three.js that allows players to take penalty kicks or play as a goalkeeper, with country selection and adjustable difficulty levels.

## Features

- **Two Game Modes**:
  - **Shoot Mode**: Take penalty shots as a striker
  - **Save Mode**: Play as a goalkeeper to save shots

- **Country Selection**: Choose from 10 different countries to represent

- **Adjustable Difficulty**: Scale from level 1-100 to match your skill

- **3D Graphics**: Immersive 3D environment built with Three.js

- **Realistic Physics**: Ball trajectory, spin, and goalkeeper movement

## How to Play

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/soccer.io.git
cd soccer.io
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Controls

#### Shooting Mode
- **Arrow Keys**: Aim the shot direction
- **Space Bar**: Hold to start the power bar, release to shoot
- The longer you hold Space, the more powerful the shot (power is visualized by the arrow color and size)

#### Goalkeeper Mode
- **Arrow Keys**: Dive in the corresponding direction when the ball is kicked
- **Left/Right**: Dive to the sides
- **Up/Down**: Adjust dive height

## Game Flow

1. Select your country from the menu
2. Choose your preferred game mode (shooting or saving)
3. Adjust the difficulty level
4. Start the game with the "Start Game" button
5. Play through 5 penalty shots
6. See your final score at the end

## Technologies Used

- **Three.js**: 3D WebGL rendering
- **JavaScript (ES6+)**: Core game logic
- **HTML5/CSS3**: User interface
- **Vite**: Build system and development server

## Development

### Project Structure

```
soccer.io/
├── index.html              # Main entry point
├── styles/                 # CSS styles
│   └── main.css
├── src/                    # JavaScript source files
│   ├── main.js             # Application entry point
│   ├── game/               # Game logic
│   │   ├── Game.js         # Main game controller
│   │   ├── Player.js       # Player entity
│   │   ├── Ball.js         # Soccer ball physics
│   │   ├── Goalkeeper.js   # AI goalkeeper
│   │   └── Level.js        # Level configuration
│   ├── ui/                 # User interface components
│   │   ├── Menu.js         # Main menu, country selection
│   │   └── GameUI.js       # In-game UI elements
│   ├── assets/             # Asset loading and management
│   │   └── AssetLoader.js
│   └── utils/              # Utility functions
│       ├── Controls.js     # Keyboard input handling
│       └── Physics.js      # Simple physics helpers
├── assets/                 # Static assets
│   ├── models/             # 3D models
│   ├── textures/           # Textures
│   ├── audio/              # Sound effects and music
│   └── flags/              # Country flags
└── package.json            # NPM dependencies
```

## Future Enhancements

- Add sound effects and music
- Implement multiplayer mode
- Add more realistic player and goalkeeper animations
- Create additional stadiums and weather conditions
- Add tournament mode with multiple rounds

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for the excellent 3D WebGL library
- Soccer enthusiasts who provided feedback on the gameplay 