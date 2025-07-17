import { InputState, Vector2 } from '@/types';

export class InputManager {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputState = {
      keys: new Set(),
      mouse: {
        position: { x: 0, y: 0 },
        isDown: false,
        button: 0
      }
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.inputState.keys.add(e.code);
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.inputState.keys.delete(e.code);
      e.preventDefault();
    });

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
      this.inputState.mouse.isDown = true;
      this.inputState.mouse.button = e.button;
      this.updateMousePosition(e);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.inputState.mouse.isDown = false;
      this.updateMousePosition(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMousePosition(e);
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private updateMousePosition(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.mouse.position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  public getInputState(): InputState {
    return this.inputState;
  }

  public isKeyPressed(key: string): boolean {
    return this.inputState.keys.has(key);
  }

  public isMouseDown(): boolean {
    return this.inputState.mouse.isDown;
  }

  public getMousePosition(): Vector2 {
    return { ...this.inputState.mouse.position };
  }
}
