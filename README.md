# CUDE 2x2

A modern, high-performance 2x2 Rubik's Cube simulator built with **Three.js** and **Lit**. Experience a sleek, professional-grade puzzle interface directly in your browser with full keyboard, mouse, and touch support.

**[🎮 Play Now](https://soknan-cude.wasmer.app/)**

## ✨ Features

-   **🎯 Precision Control:** Drag cube layers directly for a tactile feel or use high-speed keyboard shortcuts.
-   **⏱️ Smart Timer:** Automatic start on first move and auto-pause upon completion. Includes manual pause/resume functionality.
-   **🎨 Modern UI:** A "Glassmorphism" inspired interface that adapts perfectly to your screen without scrolling.
-   **🌓 Theme Support:** Seamless switching between Light Mode, Dark Mode, and System preferences.
-   **🏆 Solved Detection:** Intelligent Raycasting logic detects when the puzzle is solved and celebrates your victory.
-   **📱 Responsive:** Fully optimized for desktop, tablet, and mobile devices.

## ⌨️ Controls

### Cube Rotations
| Layer | Clockwise | Counter-Clockwise |
| :--- | :---: | :---: |
| **Left Layer** | `Q` | `A` |
| **Up Layer** | `W` | `S` |
| **Front Layer** | `E` | `D` |
| **Right Layer** | `R` | `F` |

### Game Shortcuts
-   **Space:** Scramble the cube
-   **N:** New solved cube
-   **P:** Pause / Resume timer
-   **Del:** Reset timer only
-   **H:** Toggle help menu
-   **G:** Dismiss "Solved" overlay
-   **Drag Cube:** Rotate layers
-   **Drag Background:** Orbit view

## 🚀 Getting Started

### Prerequisites
-   [Node.js](https://nodejs.org/) (Latest LTS recommended)
-   npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cude-2x2.git
   cd cude-2x2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

-   **[Three.js](https://threejs.org/):** 3D graphics engine for cube rendering and animation.
-   **[Lit](https://lit.dev/):** Lightweight web components for high-performance UI.
-   **[TypeScript](https://www.typescriptlang.org/):** Type-safe development.
-   **[Vite](https://vitejs.dev/):** Ultra-fast frontend tooling and bundling.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
