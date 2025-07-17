import { GameEngine } from '@/game/GameEngine';
import { DemoScene } from '@/game/DemoScene';

class Game {
  private engine: GameEngine;
  private demoScene: DemoScene;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Could not find game canvas element');
    }

    this.engine = new GameEngine(canvas);
    this.demoScene = new DemoScene();
    
    this.setupUI();
    this.init();
  }

  private setupUI(): void {
    const newGameBtn = document.getElementById('newGameBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

    newGameBtn?.addEventListener('click', () => {
      this.startNewGame();
    });

    pauseBtn?.addEventListener('click', () => {
      this.engine.pause();
      const gameState = this.engine.getGameState();
      if (pauseBtn) {
        pauseBtn.textContent = gameState.isPaused ? 'Resume' : 'Pause';
      }
    });

    resetBtn?.addEventListener('click', () => {
      this.engine.reset();
      this.startNewGame();
    });
  }

  private init(): void {
    this.engine.setScene(this.demoScene);
    this.startNewGame();
  }

  private startNewGame(): void {
    this.engine.reset();
    this.engine.start();
    
    // Update pause button text
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.textContent = 'Pause';
    }
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new Game();
    console.log('RailYard Shuffle game initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});
