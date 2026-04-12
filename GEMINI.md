# GEMINI.md - cude-2x2

## Project Overview
`cude-2x2` is a web-based 2x2 Rubik's Cube game/simulator. It uses 3D rendering to provide an interactive experience where players can manipulate and solve a 2x2 pocket cube directly in their browser.

### Key Technologies
- **Lit**: A library for building lightweight web components.
- **Three.js**: A cross-browser JavaScript library and application programming interface used to create and display animated 3D computer graphics in a web browser using WebGL.
- **TypeScript**: The primary programming language, providing type safety and modern JavaScript features.
- **Vite**: The frontend build tool and development server.

## Architecture
- **Entry Point**: `index.html` loads the main application component.
- **Main Component (`src/my-element.ts`)**: Acts as the root container, styling the layout and hosting the game component.
- **Game Component (`src/cube-game.ts`)**: Contains the core 3D logic, Three.js scene setup, cubie management, interaction handling (dragging layers), and game state (timer, scrambling).
- **Styling**: Uses CSS-in-JS (via Lit's `css` tag) with a focus on modern, responsive design and dark mode support.

## Building and Running

### Development
To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Production Build
To compile TypeScript and build the project for production:
```bash
npm run build
```

### Preview
To preview the production build locally:
```bash
npm run preview
```

## Development Conventions
- **Web Components**: All UI components are built using Lit.
- **3D Logic**: Three.js is used for all 3D rendering. Interaction with the cube is handled through custom event listeners and Raycasting (implied by dragging state in `cube-game.ts`).
- **Formatting**: Adheres to standard TypeScript and Lit practices. CSS variables are used extensively for theme management in `my-element.ts`.
- **Naming**: The project name `cude-2x2` appears to be a stylized version of "Cube 2x2".
