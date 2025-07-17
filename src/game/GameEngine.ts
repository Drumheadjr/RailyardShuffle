import { GameState, Scene, GameStateType } from '@/types';
import { InputManager } from '@/utils/InputManager';
import { GameStateManager } from './GameStateManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputManager: InputManager;
  private gameStateManager: GameStateManager;
  private currentScene: Scene | null = null;
  private lastTime: number = 0;
  private animationId: number = 0;
  private sceneTransitionCallback?: (newState: GameStateType) => Scene | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;

    this.inputManager = new InputManager(canvas);
    this.gameStateManager = new GameStateManager();

    // Set up state change listener
    this.setupStateChangeListener();
  }

  private setupStateChangeListener(): void {
    // Listen for all state changes and handle scene transitions
    Object.values(GameStateType).forEach(state => {
      this.gameStateManager.onStateChange(state, () => {
        this.handleStateChange(state);
      });
    });
  }

  private handleStateChange(newState: GameStateType): void {
    console.log(`Handling state change to: ${newState}`);

    // Call onExit for current scene
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit();
    }

    // Get new scene from callback
    if (this.sceneTransitionCallback) {
      this.currentScene = this.sceneTransitionCallback(newState);
    }

    // Call onEnter for new scene
    if (this.currentScene && this.currentScene.onEnter) {
      this.currentScene.onEnter();
    }
  }

  public setScene(scene: Scene): void {
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit();
    }

    this.currentScene = scene;

    if (this.currentScene && this.currentScene.onEnter) {
      this.currentScene.onEnter();
    }
  }

  public setSceneTransitionCallback(callback: (newState: GameStateType) => Scene | null): void {
    this.sceneTransitionCallback = callback;
  }

  public start(): void {
    const gameData = this.gameStateManager.getGameData();
    if (gameData.isRunning) return;

    this.gameStateManager.setState(GameStateType.MAIN_MENU);
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  public pause(): void {
    const currentState = this.gameStateManager.getCurrentState();
    if (currentState === GameStateType.PLAYING) {
      this.gameStateManager.setState(GameStateType.PAUSED);
    } else if (currentState === GameStateType.PAUSED) {
      this.gameStateManager.setState(GameStateType.PLAYING);
    }
  }

  public stop(): void {
    this.gameStateManager.resetGame();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public reset(): void {
    this.gameStateManager.resetGame();
  }

  private gameLoop = (currentTime: number): void => {
    const gameData = this.gameStateManager.getGameData();
    if (!gameData.isRunning && this.gameStateManager.getCurrentState() === GameStateType.MAIN_MENU) {
      // Allow main menu to run even when game is not "running"
    } else if (!gameData.isRunning) {
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!gameData.isPaused) {
      this.update(deltaTime);
    }

    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (this.currentScene) {
      const inputState = this.inputManager.getInputState();
      this.currentScene.handleInput(inputState);
      this.currentScene.update(deltaTime);
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render current scene
    if (this.currentScene) {
      this.currentScene.render(this.ctx);
    }

    // Render pause overlay if paused
    const gameData = this.gameStateManager.getGameData();
    if (gameData.isPaused) {
      this.renderPauseOverlay();
    }
  }

  private renderPauseOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
  }

  public getGameState(): GameState {
    return this.gameStateManager.getGameData();
  }

  public getGameStateManager(): GameStateManager {
    return this.gameStateManager;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
