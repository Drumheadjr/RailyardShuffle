import { GameState, Scene } from '@/types';
import { InputManager } from '@/utils/InputManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputManager: InputManager;
  private gameState: GameState;
  private currentScene: Scene | null = null;
  private lastTime: number = 0;
  private animationId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    
    this.inputManager = new InputManager(canvas);
    this.gameState = {
      isRunning: false,
      isPaused: false,
      score: 0,
      level: 1
    };
  }

  public setScene(scene: Scene): void {
    this.currentScene = scene;
  }

  public start(): void {
    if (this.gameState.isRunning) return;
    
    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  public pause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
  }

  public stop(): void {
    this.gameState.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public reset(): void {
    this.gameState.score = 0;
    this.gameState.level = 1;
    this.gameState.isPaused = false;
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.gameState.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.gameState.isPaused) {
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
    if (this.gameState.isPaused) {
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
    return { ...this.gameState };
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
