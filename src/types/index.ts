export interface Vector2 {
  x: number;
  y: number;
}

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  level: number;
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
}
