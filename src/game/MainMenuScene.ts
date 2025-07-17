import { Scene, InputState, Vector2 } from '@/types';
import { GameStateManager } from './GameStateManager';
import { GameStateType } from '@/types';
import { AssetManager } from '@/utils/AssetManager';

interface MenuButton {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  action: () => void;
  hovered: boolean;
  color: string;
  hoverColor: string;
}

export class MainMenuScene implements Scene {
  private buttons: MenuButton[] = [];
  private gameStateManager: GameStateManager;
  private canvas: HTMLCanvasElement;
  private animationTime: number = 0;
  private titlePulse: number = 0;
  private assetManager: AssetManager;
  private lastMouseDown: boolean = false;

  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.canvas = canvas;
    this.assetManager = AssetManager.getInstance();
    this.setupButtons();
    this.loadAssets();
  }

  private async loadAssets(): Promise<void> {
    try {
      await this.assetManager.loadMainMenuBackground();
      console.log('Main menu assets loaded successfully');
    } catch (error) {
      console.warn('Failed to load main menu background:', error);
    }
  }

  private setupButtons(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonSpacing = 80;

    this.buttons = [
      {
        x: centerX - buttonWidth / 2,
        y: centerY - buttonHeight / 2 - buttonSpacing / 2,
        width: buttonWidth,
        height: buttonHeight,
        text: 'PLAY',
        action: () => this.startGame(),
        hovered: false,
        color: '#4CAF50',
        hoverColor: '#66BB6A'
      },
      {
        x: centerX - buttonWidth / 2,
        y: centerY - buttonHeight / 2 + buttonSpacing / 2,
        width: buttonWidth,
        height: buttonHeight,
        text: 'LEVEL SELECT',
        action: () => this.openLevelSelect(),
        hovered: false,
        color: '#2196F3',
        hoverColor: '#42A5F5'
      }
    ];
  }

  private startGame(): void {
    console.log('Starting game...');
    this.gameStateManager.setState(GameStateType.PLAYING);
  }

  private openLevelSelect(): void {
    console.log('Opening level select...');
    this.gameStateManager.setState(GameStateType.LEVEL_SELECT);
  }

  public onEnter(): void {
    console.log('Entered Main Menu');
    this.animationTime = 0;
  }

  public onExit(): void {
    console.log('Exited Main Menu');
  }

  public handleInput(input: InputState): void {
    // Detect mouse click (mouse was down last frame, up this frame = click completed)
    const mouseClicked = !input.mouse.isDown && this.lastMouseDown;
    this.lastMouseDown = input.mouse.isDown;

    // Handle mouse hover and clicks
    this.buttons.forEach(button => {
      const isHovered = this.isPointInButton(input.mouse.position, button);
      button.hovered = isHovered;

      if (isHovered && mouseClicked) {
        console.log(`Main menu button clicked: ${button.text}`);
        button.action();
      }
    });

    // Handle keyboard shortcuts
    if (input.keys.has('Enter') || input.keys.has('Space')) {
      this.startGame();
    }
  }

  private isPointInButton(point: Vector2, button: MenuButton): boolean {
    return point.x >= button.x &&
           point.x <= button.x + button.width &&
           point.y >= button.y &&
           point.y <= button.y + button.height;
  }

  public update(deltaTime: number): void {
    this.animationTime += deltaTime * 0.001;
    this.titlePulse = Math.sin(this.animationTime * 2) * 0.1 + 1;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear background with gradient
    this.renderBackground(ctx);
    
    // Render title
    this.renderTitle(ctx);
    
    // Render subtitle
    this.renderSubtitle(ctx);
    
    // Render buttons
    this.renderButtons(ctx);
    
    // Render instructions
    this.renderInstructions(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    const backgroundImage = this.assetManager.getImage('main-menu-background');

    if (backgroundImage) {
      // Draw the background image, scaled to fit the canvas
      ctx.drawImage(backgroundImage, 0, 0, this.canvas.width, this.canvas.height);

      // Add a subtle overlay for better text readability
      const overlay = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      overlay.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Fallback gradient background while image loads or if it fails
      const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
      const time = this.animationTime * 0.5;

      gradient.addColorStop(0, `hsl(${220 + Math.sin(time) * 20}, 70%, 20%)`);
      gradient.addColorStop(0.5, `hsl(${240 + Math.cos(time * 0.7) * 15}, 60%, 15%)`);
      gradient.addColorStop(1, `hsl(${200 + Math.sin(time * 1.2) * 25}, 80%, 25%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Add some animated particles for extra visual appeal
    this.renderParticles(ctx);
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    
    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(this.animationTime * 0.3 + i) * 100 + this.canvas.width / 2) % this.canvas.width;
      const y = (Math.cos(this.animationTime * 0.2 + i * 0.5) * 50 + this.canvas.height / 2) % this.canvas.height;
      const size = Math.sin(this.animationTime + i) * 2 + 3;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderTitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const titleY = 150;
    
    // Title shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = `bold ${64 * this.titlePulse}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('RAILYARD SHUFFLE', centerX + 3, titleY + 3);
    
    // Main title
    const gradient = ctx.createLinearGradient(0, titleY - 40, 0, titleY + 40);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF6347');
    
    ctx.fillStyle = gradient;
    ctx.fillText('RAILYARD SHUFFLE', centerX, titleY);
  }

  private renderSubtitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const subtitleY = 200;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A Puzzle Adventure', centerX, subtitleY);
  }

  private renderButtons(ctx: CanvasRenderingContext2D): void {
    this.buttons.forEach(button => {
      // Button shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(button.x + 3, button.y + 3, button.width, button.height);
      
      // Button background
      ctx.fillStyle = button.hovered ? button.hoverColor : button.color;
      ctx.fillRect(button.x, button.y, button.width, button.height);
      
      // Button border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(button.x, button.y, button.width, button.height);
      
      // Button text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2 + 8
      );
    });
  }

  private renderInstructions(ctx: CanvasRenderingContext2D): void {
    const instructions = [
      'Press ENTER or SPACE to start',
      'Click the PLAY button to begin your adventure'
    ];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';

    instructions.forEach((instruction, index) => {
      ctx.fillText(
        instruction,
        this.canvas.width / 2,
        this.canvas.height - 60 + index * 20
      );
    });
  }
}
