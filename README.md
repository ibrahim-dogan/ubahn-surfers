# UBahn Surfers

A simple 3D endless runner game built with Three.js inspired by Subway Surfers. The game features a character running along U-Bahn (subway) tracks, avoiding obstacles and collecting coins.

## Features

- 3D environment with three lanes to run in
- Randomly generated obstacles
- Collectible coins for bonus points
- Simple controls (keyboard and touch)
- Increasing difficulty as your score grows

## How to Play

### Controls

- **Left/Right Arrow Keys** or **A/D Keys**: Move left/right to change lanes
- **Up/Down Arrow Keys** or **W/S Keys**: Change lanes (alternative controls)
- **Spacebar**: Jump over obstacles
- **Touch Controls**: 
  - Tap left/right side of screen to move
  - Tap top of screen to jump

### Game Rules

1. Run as far as you can without hitting obstacles
2. Collect coins for bonus points
3. Your score increases automatically as you run
4. The game speeds up as your score increases
5. Game ends when you hit an obstacle

## Development

### Prerequisites

- Node.js and npm installed

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/ubahn-surfers.git
cd ubahn-surfers
```

2. Install dependencies
```
npm install
```

3. Run the development server
```
npm start
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```
npm run build
```

## Technologies Used

- Three.js - 3D graphics library
- Vite - Frontend build tool

## Future Improvements

- Character model with animations
- More varied obstacles and environments
- Power-ups (magnet, speed boost, etc.)
- Improved graphics and visual effects
- Level progression
- Sound effects and music
- High score system 