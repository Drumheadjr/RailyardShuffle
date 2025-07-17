# RailYard Shuffle - TypeScript Puzzle Game

A TypeScript-based puzzle game that runs in the browser, built with modern web development tools.

## 🚀 Quick Start

### Development
```bash
npm run dev
```
This starts the development server at `http://localhost:3000` with hot reload.

### Building for Production
```bash
npm run build
```
Builds the project for production in the `dist/` folder.

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing.

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm run serve` - Build and serve production version

## 🏗️ Project Structure

```
src/
├── game/           # Game engine and scenes
│   ├── GameEngine.ts    # Main game engine
│   └── DemoScene.ts     # Demo scene with interactive box
├── utils/          # Utility classes
│   └── InputManager.ts  # Keyboard and mouse input handling
├── types/          # TypeScript type definitions
│   └── index.ts         # Game-related interfaces
└── main.ts         # Application entry point
```

## 🎮 Current Features

The framework includes:

- **Game Engine**: Complete game loop with update/render cycle
- **Input Management**: Keyboard (WASD/Arrow keys) and mouse support
- **Scene System**: Modular scene management
- **TypeScript**: Full type safety and modern JavaScript features
- **Hot Reload**: Instant development feedback with Vite
- **Production Ready**: Optimized builds with bundling

## 🎯 Demo Scene

The current demo includes an interactive red box that:
- Moves with WASD or arrow keys
- Can be dragged with the mouse
- Bounces off canvas boundaries
- Has physics with velocity and friction

## 🔧 Technology Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **HTML5 Canvas** - 2D graphics rendering
- **Modern ES Modules** - Clean module system

## 🎨 Game Development

The framework is ready for puzzle game development with:

1. **Modular Architecture**: Easy to add new scenes and game objects
2. **Input System**: Ready-to-use keyboard and mouse handling
3. **Game Loop**: Proper timing and frame management
4. **Type Safety**: Full TypeScript support for better development experience

## 📝 Next Steps

To build your puzzle game:

1. Create new scene classes implementing the `Scene` interface
2. Add game objects implementing the `GameObject` interface
3. Implement your puzzle logic in the scene's update method
4. Handle user interactions in the scene's handleInput method
5. Render your game elements in the scene's render method

## 🐛 Development

The project is set up with:
- Port forwarding (3000) configured in devcontainer
- TypeScript strict mode enabled
- Modern ES2020 target
- Path aliases (`@/` points to `src/`)

Happy coding! 🎮
