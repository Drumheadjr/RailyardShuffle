import { Scene, InputState } from '@/types';
import { GameStateManager } from '../GameStateManager';
import { GameStateType } from '@/types';

export class Level3Scene implements Scene {
  private gameStateManager: GameStateManager;
  private canvas: HTMLCanvasElement;
  private levelComplete: boolean = false;
  private completionTime: number = 0;

  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.canvas = canvas;
    this.setupLevel();
  }

  private setupLevel(): void {
    this.levelComplete = false;
  }

  public onEnter(): void {
    console.log('Entered Level 3: Coming Soon');
    this.setupLevel();
  }

  public onExit(): void {
    console.log('Exited Level 3');
  }

  public handleInput(input: InputState): void {
    // Return to menu
    if (input.keys.has('Escape')) {
      this.gameStateManager.setState(GameStateType.MAIN_MENU);
    }

    // Complete level for testing
    if (input.keys.has('KeyC') || input.keys.has('Space') || input.keys.has('Enter')) {
      this.completeLevel();
    }
  }

  public update(deltaTime: number): void {
    if (this.levelComplete) {
      this.completionTime += deltaTime;
      
      if (this.completionTime > 2000) {
        this.gameStateManager.nextLevel();
        this.gameStateManager.setState(GameStateType.LEVEL_COMPLETE);
      }
      return;
    }
  }

  private completeLevel(): void {
    if (!this.levelComplete) {
      this.levelComplete = true;
      this.completionTime = 0;
      this.gameStateManager.updateScore(1500);
      console.log('Level 3 completed!');
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear background with a different color
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#1A1A2E');
    gradient.addColorStop(0.5, '#16213E');
    gradient.addColorStop(1, '#0F3460');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render UI
    this.renderUI(ctx);
    
    if (this.levelComplete) {
      this.renderCompletionMessage(ctx);
    }
  }

  private renderUI(ctx: CanvasRenderingContext2D): void {
    const gameData = this.gameStateManager.getGameData();
    
    // Level info
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${gameData.currentLevel}: Coming Soon`, 20, 40);
    
    // Score
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${gameData.score}`, 20, 70);
    
    // Coming soon message
    ctx.fillStyle = '#3498DB';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COMING SOON', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '24px Arial';
    ctx.fillText('This level is under construction', this.canvas.width / 2, this.canvas.height / 2);
    
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE or ENTER to complete', this.canvas.width / 2, this.canvas.height / 2 + 40);
    ctx.fillText('Press ESC to return to menu', this.canvas.width / 2, this.canvas.height / 2 + 70);
    
    // Instructions at bottom
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('This demonstrates how easy it is to add new levels!', 20, this.canvas.height - 40);
    ctx.fillText('Each level is completely independent and self-contained.', 20, this.canvas.height - 20);
  }

  private renderCompletionMessage(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Completion message
    ctx.fillStyle = '#2ECC71';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Thanks for testing the level system!', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
}
