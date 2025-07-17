import { Scene, InputState, Vector2, GameObject } from '@/types';
import { GameStateManager } from '../GameStateManager';
import { GameStateType } from '@/types';

class PuzzleBox implements GameObject {
  public position: Vector2;
  public size: Vector2;
  public velocity: Vector2;
  public color: string;
  private targetPosition: Vector2;
  private isAtTarget: boolean = false;
  private id: number;

  constructor(x: number, y: number, targetX: number, targetY: number, id: number) {
    this.position = { x, y };
    this.size = { x: 40, y: 40 };
    this.velocity = { x: 0, y: 0 };
    this.targetPosition = { x: targetX, y: targetY };
    this.color = '#FF6B6B';
    this.id = id;
  }

  update(deltaTime: number): void {
    // Apply velocity
    this.position.x += this.velocity.x * deltaTime * 0.001;
    this.position.y += this.velocity.y * deltaTime * 0.001;

    // Apply friction
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;

    // Check if at target
    const distance = Math.sqrt(
      Math.pow(this.position.x - this.targetPosition.x, 2) +
      Math.pow(this.position.y - this.targetPosition.y, 2)
    );
    
    this.isAtTarget = distance < 20;
    this.color = this.isAtTarget ? '#4ECDC4' : '#FF6B6B';
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Box shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(this.position.x + 2, this.position.y + 2, this.size.x, this.size.y);
    
    // Main box
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
    
    // Box border
    ctx.strokeStyle = this.isAtTarget ? '#26A69A' : '#E53E3E';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);
    
    // Box number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.id.toString(),
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2 + 6
    );
  }

  public isAtTargetPosition(): boolean {
    return this.isAtTarget;
  }

  public getTargetPosition(): Vector2 {
    return { ...this.targetPosition };
  }

  public move(dx: number, dy: number): void {
    this.velocity.x += dx;
    this.velocity.y += dy;
  }
}

export class Level1Scene implements Scene {
  private boxes: PuzzleBox[] = [];
  private gameStateManager: GameStateManager;
  private canvas: HTMLCanvasElement;
  private selectedBox: PuzzleBox | null = null;
  private dragOffset: Vector2 = { x: 0, y: 0 };
  private levelComplete: boolean = false;
  private completionTime: number = 0;
  private startTime: number = 0;

  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.canvas = canvas;
    this.setupLevel();
  }

  private setupLevel(): void {
    // Create puzzle boxes and their target positions
    this.boxes = [
      new PuzzleBox(100, 200, 600, 200, 1),
      new PuzzleBox(200, 300, 600, 300, 2),
      new PuzzleBox(300, 400, 600, 400, 3)
    ];
    
    this.levelComplete = false;
    this.startTime = Date.now();
  }

  public onEnter(): void {
    console.log('Entered Level 1: Basic Sorting');
    this.setupLevel();
  }

  public onExit(): void {
    console.log('Exited Level 1');
  }

  public handleInput(input: InputState): void {
    // Handle mouse interaction for dragging boxes
    if (input.mouse.isDown && !this.selectedBox) {
      // Find box under mouse
      for (const box of this.boxes) {
        if (this.isPointInBox(input.mouse.position, box)) {
          this.selectedBox = box;
          this.dragOffset = {
            x: input.mouse.position.x - box.position.x,
            y: input.mouse.position.y - box.position.y
          };
          break;
        }
      }
    }

    if (this.selectedBox && input.mouse.isDown) {
      // Drag the selected box
      this.selectedBox.position.x = input.mouse.position.x - this.dragOffset.x;
      this.selectedBox.position.y = input.mouse.position.y - this.dragOffset.y;
      
      // Reset velocity while dragging
      this.selectedBox.velocity.x = 0;
      this.selectedBox.velocity.y = 0;
    }

    if (!input.mouse.isDown && this.selectedBox) {
      // Release the box
      this.selectedBox = null;
    }

    // Keyboard controls
    if (input.keys.has('KeyR')) {
      this.resetLevel();
    }

    if (input.keys.has('Escape')) {
      this.gameStateManager.setState(GameStateType.MAIN_MENU);
    }

    // Cheat code for testing
    if (input.keys.has('KeyC')) {
      this.completeLevel();
    }
  }

  private isPointInBox(point: Vector2, box: PuzzleBox): boolean {
    return point.x >= box.position.x &&
           point.x <= box.position.x + box.size.x &&
           point.y >= box.position.y &&
           point.y <= box.position.y + box.size.y;
  }

  public update(deltaTime: number): void {
    if (this.levelComplete) {
      this.completionTime += deltaTime;
      
      // Auto-advance after showing completion for 2 seconds
      if (this.completionTime > 2000) {
        this.gameStateManager.nextLevel();
        this.gameStateManager.setState(GameStateType.LEVEL_COMPLETE);
      }
      return;
    }

    // Update all boxes
    this.boxes.forEach(box => box.update(deltaTime));

    // Check if level is complete
    if (this.boxes.every(box => box.isAtTargetPosition())) {
      this.completeLevel();
    }
  }

  private completeLevel(): void {
    if (!this.levelComplete) {
      this.levelComplete = true;
      this.completionTime = 0;
      
      const timeBonus = Math.max(0, 1000 - (Date.now() - this.startTime) / 10);
      this.gameStateManager.updateScore(500 + Math.floor(timeBonus));
      
      console.log('Level 1 completed!');
    }
  }

  private resetLevel(): void {
    console.log('Resetting level...');
    this.setupLevel();
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear background
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render grid
    this.renderGrid(ctx);
    
    // Render target positions
    this.renderTargets(ctx);
    
    // Render boxes
    this.boxes.forEach(box => box.render(ctx));
    
    // Render UI
    this.renderUI(ctx);
    
    // Render completion message if level is complete
    if (this.levelComplete) {
      this.renderCompletionMessage(ctx);
    }
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= this.canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  private renderTargets(ctx: CanvasRenderingContext2D): void {
    this.boxes.forEach(box => {
      const target = box.getTargetPosition();
      
      // Target outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(target.x, target.y, box.size.x, box.size.y);
      ctx.setLineDash([]);
      
      // Target fill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(target.x, target.y, box.size.x, box.size.y);
    });
  }

  private renderUI(ctx: CanvasRenderingContext2D): void {
    const gameData = this.gameStateManager.getGameData();
    
    // Level info
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${gameData.currentLevel}: Basic Sorting`, 20, 40);
    
    // Score
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${gameData.score}`, 20, 70);
    
    // Instructions
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Drag the numbered boxes to their target positions', 20, this.canvas.height - 60);
    ctx.fillText('Press R to reset, ESC to return to menu', 20, this.canvas.height - 40);
    ctx.fillText('Press C to complete level (cheat)', 20, this.canvas.height - 20);
  }

  private renderCompletionMessage(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Completion message
    ctx.fillStyle = '#4ECDC4';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Great job! Moving to next level...', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
}
