import { Scene, InputState, Vector2, GameObject } from '@/types';
import { GameStateManager } from '../GameStateManager';
import { GameStateType } from '@/types';

class MovingPlatform implements GameObject {
  public position: Vector2;
  public size: Vector2;
  public velocity: Vector2;
  public color: string;
  public direction: number = 1;
  private minX: number;
  private maxX: number;

  constructor(x: number, y: number, minX: number, maxX: number) {
    this.position = { x, y };
    this.size = { x: 80, y: 20 };
    this.velocity = { x: 50, y: 0 };
    this.color = '#8E44AD';
    this.minX = minX;
    this.maxX = maxX;
  }

  update(deltaTime: number): void {
    // Move platform back and forth
    this.position.x += this.velocity.x * this.direction * deltaTime * 0.001;
    
    // Bounce off boundaries
    if (this.position.x <= this.minX || this.position.x + this.size.x >= this.maxX) {
      this.direction *= -1;
    }
    
    // Keep within bounds
    this.position.x = Math.max(this.minX, Math.min(this.maxX - this.size.x, this.position.x));
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Platform shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(this.position.x + 2, this.position.y + 2, this.size.x, this.size.y);
    
    // Main platform
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
    
    // Platform border
    ctx.strokeStyle = '#6C3483';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
}

class CollectibleGem implements GameObject {
  public position: Vector2;
  public size: Vector2;
  public velocity: Vector2;
  public color: string;
  private collected: boolean = false;
  private animationTime: number = 0;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.size = { x: 20, y: 20 };
    this.velocity = { x: 0, y: 0 };
    this.color = '#F1C40F';
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime * 0.005;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;
    
    const pulse = Math.sin(this.animationTime) * 0.2 + 1;
    const size = this.size.x * pulse;
    const offset = (size - this.size.x) / 2;
    
    // Gem glow
    ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
    ctx.fillRect(this.position.x - offset - 5, this.position.y - offset - 5, size + 10, size + 10);
    
    // Main gem
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x - offset, this.position.y - offset, size, size);
    
    // Gem highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(this.position.x - offset + 2, this.position.y - offset + 2, size / 3, size / 3);
  }

  public isCollected(): boolean {
    return this.collected;
  }

  public collect(): void {
    this.collected = true;
  }

  public checkCollision(point: Vector2, radius: number): boolean {
    if (this.collected) return false;
    
    const distance = Math.sqrt(
      Math.pow(point.x - (this.position.x + this.size.x / 2), 2) +
      Math.pow(point.y - (this.position.y + this.size.y / 2), 2)
    );
    
    return distance < radius + this.size.x / 2;
  }
}

export class Level2Scene implements Scene {
  private gameStateManager: GameStateManager;
  private canvas: HTMLCanvasElement;
  private platforms: MovingPlatform[] = [];
  private gems: CollectibleGem[] = [];
  private playerPos: Vector2 = { x: 100, y: 500 };
  private playerSize: Vector2 = { x: 30, y: 30 };
  private playerVelocity: Vector2 = { x: 0, y: 0 };
  private isOnGround: boolean = false;
  private levelComplete: boolean = false;
  private completionTime: number = 0;
  private startTime: number = 0;

  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.canvas = canvas;
    this.setupLevel();
  }

  private setupLevel(): void {
    // Create moving platforms
    this.platforms = [
      new MovingPlatform(200, 400, 150, 400),
      new MovingPlatform(500, 300, 450, 650),
      new MovingPlatform(300, 200, 250, 500)
    ];
    
    // Create collectible gems
    this.gems = [
      new CollectibleGem(220, 370),
      new CollectibleGem(520, 270),
      new CollectibleGem(320, 170),
      new CollectibleGem(650, 450)
    ];
    
    this.playerPos = { x: 100, y: 500 };
    this.playerVelocity = { x: 0, y: 0 };
    this.levelComplete = false;
    this.startTime = Date.now();
  }

  public onEnter(): void {
    console.log('Entered Level 2: Moving Platforms');
    this.setupLevel();
  }

  public onExit(): void {
    console.log('Exited Level 2');
  }

  public handleInput(input: InputState): void {
    const speed = 200;
    const jumpPower = 300;

    // Horizontal movement
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) {
      this.playerVelocity.x = -speed;
    } else if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) {
      this.playerVelocity.x = speed;
    } else {
      this.playerVelocity.x *= 0.8; // Friction
    }

    // Jumping
    if ((input.keys.has('KeyW') || input.keys.has('ArrowUp') || input.keys.has('Space')) && this.isOnGround) {
      this.playerVelocity.y = -jumpPower;
      this.isOnGround = false;
    }

    // Reset level
    if (input.keys.has('KeyR')) {
      this.resetLevel();
    }

    // Return to menu
    if (input.keys.has('Escape')) {
      this.gameStateManager.setState(GameStateType.MAIN_MENU);
    }

    // Cheat code
    if (input.keys.has('KeyC')) {
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

    // Update platforms
    this.platforms.forEach(platform => platform.update(deltaTime));
    
    // Update gems
    this.gems.forEach(gem => gem.update(deltaTime));

    // Apply gravity to player
    this.playerVelocity.y += 800 * deltaTime * 0.001; // Gravity

    // Update player position
    this.playerPos.x += this.playerVelocity.x * deltaTime * 0.001;
    this.playerPos.y += this.playerVelocity.y * deltaTime * 0.001;

    // Ground collision
    const groundY = this.canvas.height - 50;
    if (this.playerPos.y + this.playerSize.y >= groundY) {
      this.playerPos.y = groundY - this.playerSize.y;
      this.playerVelocity.y = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

    // Platform collision
    this.platforms.forEach(platform => {
      if (this.checkPlatformCollision(platform)) {
        this.playerPos.y = platform.position.y - this.playerSize.y;
        this.playerVelocity.y = 0;
        this.isOnGround = true;
        // Move with platform
        this.playerPos.x += platform.velocity.x * platform.direction * deltaTime * 0.001;
      }
    });

    // Gem collection
    this.gems.forEach(gem => {
      if (gem.checkCollision({ x: this.playerPos.x + this.playerSize.x / 2, y: this.playerPos.y + this.playerSize.y / 2 }, 20)) {
        if (!gem.isCollected()) {
          gem.collect();
          this.gameStateManager.updateScore(100);
        }
      }
    });

    // Keep player in bounds
    this.playerPos.x = Math.max(0, Math.min(this.canvas.width - this.playerSize.x, this.playerPos.x));

    // Check level completion
    if (this.gems.every(gem => gem.isCollected())) {
      this.completeLevel();
    }

    // Reset if player falls off screen
    if (this.playerPos.y > this.canvas.height) {
      this.resetLevel();
    }
  }

  private checkPlatformCollision(platform: MovingPlatform): boolean {
    return this.playerPos.x < platform.position.x + platform.size.x &&
           this.playerPos.x + this.playerSize.x > platform.position.x &&
           this.playerPos.y + this.playerSize.y > platform.position.y &&
           this.playerPos.y + this.playerSize.y < platform.position.y + platform.size.y + 10 &&
           this.playerVelocity.y >= 0;
  }

  private completeLevel(): void {
    if (!this.levelComplete) {
      this.levelComplete = true;
      this.completionTime = 0;
      
      const timeBonus = Math.max(0, 2000 - (Date.now() - this.startTime) / 10);
      const gemBonus = this.gems.filter(gem => gem.isCollected()).length * 100;
      this.gameStateManager.updateScore(1000 + Math.floor(timeBonus) + gemBonus);
      
      console.log('Level 2 completed!');
    }
  }

  private resetLevel(): void {
    console.log('Resetting level...');
    this.setupLevel();
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear background
    ctx.fillStyle = '#34495E';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render ground
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);

    // Render platforms
    this.platforms.forEach(platform => platform.render(ctx));
    
    // Render gems
    this.gems.forEach(gem => gem.render(ctx));
    
    // Render player
    this.renderPlayer(ctx);
    
    // Render UI
    this.renderUI(ctx);
    
    if (this.levelComplete) {
      this.renderCompletionMessage(ctx);
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(this.playerPos.x + 2, this.playerPos.y + 2, this.playerSize.x, this.playerSize.y);
    
    // Main player
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(this.playerPos.x, this.playerPos.y, this.playerSize.x, this.playerSize.y);
    
    // Player border
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.playerPos.x, this.playerPos.y, this.playerSize.x, this.playerSize.y);
  }

  private renderUI(ctx: CanvasRenderingContext2D): void {
    const gameData = this.gameStateManager.getGameData();
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${gameData.currentLevel}: Moving Platforms`, 20, 40);
    
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${gameData.score}`, 20, 70);
    
    const collectedGems = this.gems.filter(gem => gem.isCollected()).length;
    ctx.fillText(`Gems: ${collectedGems}/${this.gems.length}`, 20, 95);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('WASD/Arrows to move, Space to jump', 20, this.canvas.height - 60);
    ctx.fillText('Collect all gems to complete the level', 20, this.canvas.height - 40);
    ctx.fillText('Press R to reset, ESC for menu', 20, this.canvas.height - 20);
  }

  private renderCompletionMessage(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#F1C40F';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('All gems collected!', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
}
