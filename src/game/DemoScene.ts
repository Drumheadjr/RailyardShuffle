import { Scene, InputState, Vector2, GameObject } from '@/types';

class DemoBox implements GameObject {
  public position: Vector2;
  public size: Vector2;
  public velocity: Vector2;
  public color: string;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.size = { x: 50, y: 50 };
    this.velocity = { x: 0, y: 0 };
    this.color = '#e74c3c';
  }

  update(deltaTime: number): void {
    // Apply velocity
    this.position.x += this.velocity.x * deltaTime * 0.001;
    this.position.y += this.velocity.y * deltaTime * 0.001;

    // Bounce off walls
    if (this.position.x <= 0 || this.position.x + this.size.x >= 800) {
      this.velocity.x *= -1;
      this.position.x = Math.max(0, Math.min(800 - this.size.x, this.position.x));
    }
    if (this.position.y <= 0 || this.position.y + this.size.y >= 600) {
      this.velocity.y *= -1;
      this.position.y = Math.max(0, Math.min(600 - this.size.y, this.position.y));
    }

    // Apply friction
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
    
    // Add a border
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
}

export class DemoScene implements Scene {
  private box: DemoBox;
  private lastMousePos: Vector2 = { x: 0, y: 0 };

  constructor() {
    this.box = new DemoBox(375, 275); // Center of 800x600 canvas
  }

  handleInput(input: InputState): void {
    const speed = 200;

    // Keyboard movement (WASD or Arrow keys)
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) {
      this.box.velocity.y -= speed;
    }
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) {
      this.box.velocity.y += speed;
    }
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) {
      this.box.velocity.x -= speed;
    }
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) {
      this.box.velocity.x += speed;
    }

    // Mouse interaction - drag the box
    if (input.mouse.isDown) {
      const dx = input.mouse.position.x - this.lastMousePos.x;
      const dy = input.mouse.position.y - this.lastMousePos.y;
      
      // Check if mouse is over the box
      if (this.isPointInBox(input.mouse.position)) {
        this.box.velocity.x += dx * 5;
        this.box.velocity.y += dy * 5;
      }
    }

    this.lastMousePos = { ...input.mouse.position };
  }

  private isPointInBox(point: Vector2): boolean {
    return point.x >= this.box.position.x &&
           point.x <= this.box.position.x + this.box.size.x &&
           point.y >= this.box.position.y &&
           point.y <= this.box.position.y + this.box.size.y;
  }

  update(deltaTime: number): void {
    this.box.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render background grid
    this.renderGrid(ctx);
    
    // Render the box
    this.box.render(ctx);
    
    // Render instructions
    this.renderInstructions(ctx);
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= 800; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= 600; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }
  }

  private renderInstructions(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Use WASD or Arrow Keys to move the box', 10, 30);
    ctx.fillText('Click and drag the box with your mouse', 10, 50);
    ctx.fillText('Framework is ready for your puzzle game!', 10, 70);
  }
}
