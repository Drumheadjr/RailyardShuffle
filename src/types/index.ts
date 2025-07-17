export interface Vector2 {
  x: number;
  y: number;
}

export enum GameStateType {
  MAIN_MENU = 'MAIN_MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  SETTINGS = 'SETTINGS'
}

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  currentLevel: number;
  currentState: GameStateType;
  lives: number;
}

export interface InputState {
  keys: Set<string>;
  mouse: {
    position: Vector2;
    isDown: boolean;
    button: number;
  };
}

export interface GameObject {
  position: Vector2;
  size: Vector2;
  velocity?: Vector2;
  color?: string;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export interface Scene {
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  handleInput(input: InputState): void;
  onEnter?(): void;
  onExit?(): void;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  targetScore?: number;
  timeLimit?: number;
  createScene(): Scene;
}

export interface GameStateManager {
  getCurrentState(): GameStateType;
  setState(state: GameStateType): void;
  getGameData(): GameState;
  updateScore(points: number): void;
  nextLevel(): void;
  resetGame(): void;
}
