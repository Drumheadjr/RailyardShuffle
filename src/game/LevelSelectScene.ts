import { Scene, InputState, Vector2, Level } from '@/types';
import { GameStateManager } from './GameStateManager';
import { LevelManager } from './LevelManager';
import { GameStateType } from '@/types';
import { AssetManager } from '@/utils/AssetManager';

interface LevelCard {
  level: Level;
  x: number;
  y: number;
  width: number;
  height: number;
  hovered: boolean;
  completed: boolean;
}

export class LevelSelectScene implements Scene {
  private gameStateManager: GameStateManager;
  private levelManager: LevelManager;
  private canvas: HTMLCanvasElement;
  private levelCards: LevelCard[] = [];
  private animationTime: number = 0;
  private backButtonHovered: boolean = false;
  private backButton: { x: number; y: number; width: number; height: number };
  private assetManager: AssetManager;
  private lastMouseDown: boolean = false;

  constructor(gameStateManager: GameStateManager, levelManager: LevelManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.levelManager = levelManager;
    this.canvas = canvas;
    this.assetManager = AssetManager.getInstance();
    
    // Setup back button
    this.backButton = {
      x: 50,
      y: 50,
      width: 100,
      height: 40
    };

    this.loadAssets();
    this.setupLevelCards();
  }

  private async loadAssets(): Promise<void> {
    try {
      // Try to load level select specific background, fallback to main menu background
      await this.assetManager.loadBackgroundWithFallback({
        name: 'level-select-background',
        basePath: '/assets/images/level-select-01',
        extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif']
      }, 'main-menu-background');
      console.log('Level select assets loaded successfully');
    } catch (error) {
      console.warn('Failed to load level select background:', error);
    }
  }

  private setupLevelCards(): void {
    const levels = this.levelManager.getAllLevels();
    const cardsPerRow = 4;
    const cardWidth = 150;
    const cardHeight = 120;
    const cardSpacing = 20;
    const startX = (this.canvas.width - (cardsPerRow * cardWidth + (cardsPerRow - 1) * cardSpacing)) / 2;
    const startY = 150;

    this.levelCards = levels.map((level, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      
      return {
        level,
        x: startX + col * (cardWidth + cardSpacing),
        y: startY + row * (cardHeight + cardSpacing),
        width: cardWidth,
        height: cardHeight,
        hovered: false,
        completed: this.isLevelCompleted(level.id)
      };
    });
  }

  private isLevelCompleted(levelId: number): boolean {
    // For now, we'll consider a level completed if it's before the current level
    // In a real game, this would check saved progress
    const currentLevel = this.gameStateManager.getCurrentLevel();
    return levelId < currentLevel;
  }

  public onEnter(): void {
    console.log('Entered Level Select');
    this.animationTime = 0;
    this.setupLevelCards(); // Refresh level cards in case new levels were added
  }

  public onExit(): void {
    console.log('Exited Level Select');
  }

  public handleInput(input: InputState): void {
    // Detect mouse click (mouse was up last frame, down this frame)
    const mouseClicked = input.mouse.isDown && !this.lastMouseDown;
    this.lastMouseDown = input.mouse.isDown;

    // Handle back button
    this.backButtonHovered = this.isPointInRect(input.mouse.position, this.backButton);
    if (this.backButtonHovered && mouseClicked) {
      console.log('Back button clicked');
      this.gameStateManager.setState(GameStateType.MAIN_MENU);
      return;
    }

    // Handle level card interactions
    this.levelCards.forEach(card => {
      card.hovered = this.isPointInRect(input.mouse.position, card);

      if (card.hovered && mouseClicked) {
        console.log(`Level card clicked: ${card.level.name}`);
        this.selectLevel(card.level);
      }
    });

    // Keyboard shortcuts
    if (input.keys.has('Escape')) {
      this.gameStateManager.setState(GameStateType.MAIN_MENU);
    }

    // Number keys for quick level selection (1-9)
    for (let i = 1; i <= 9; i++) {
      if (input.keys.has(`Digit${i}`) || input.keys.has(`Numpad${i}`)) {
        const level = this.levelManager.getLevel(i);
        if (level) {
          console.log(`Keyboard shortcut used for level ${i}`);
          this.selectLevel(level);
        }
      }
    }
  }

  private isPointInRect(point: Vector2, rect: { x: number; y: number; width: number; height: number }): boolean {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  private selectLevel(level: Level): void {
    console.log(`Selected level ${level.id}: ${level.name}`);

    // Set the selected level as current in both managers
    this.levelManager.setCurrentLevel(level.id);
    this.gameStateManager.setCurrentLevel(level.id);

    // Transition to playing state
    this.gameStateManager.setState(GameStateType.PLAYING);
  }

  public update(deltaTime: number): void {
    this.animationTime += deltaTime * 0.001;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear background with gradient
    this.renderBackground(ctx);
    
    // Render title
    this.renderTitle(ctx);
    
    // Render back button
    this.renderBackButton(ctx);
    
    // Render level cards
    this.renderLevelCards(ctx);
    
    // Render instructions
    this.renderInstructions(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    // Try level select specific background first, then fallback to main menu background
    let backgroundImage = this.assetManager.getImage('level-select-background');
    if (!backgroundImage) {
      backgroundImage = this.assetManager.getImage('main-menu-background');
    }

    if (backgroundImage) {
      // Draw the background image, scaled to fit the canvas
      ctx.drawImage(backgroundImage, 0, 0, this.canvas.width, this.canvas.height);

      // Add a darker overlay for better readability of level cards
      const overlay = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
      overlay.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Fallback gradient background while image loads or if it fails
      const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
      const time = this.animationTime * 0.3;

      gradient.addColorStop(0, `hsl(${200 + Math.sin(time) * 15}, 60%, 25%)`);
      gradient.addColorStop(0.5, `hsl(${220 + Math.cos(time * 0.8) * 10}, 70%, 20%)`);
      gradient.addColorStop(1, `hsl(${180 + Math.sin(time * 1.1) * 20}, 50%, 30%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private renderTitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const titleY = 80;
    
    // Title shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT LEVEL', centerX + 2, titleY + 2);
    
    // Main title
    const gradient = ctx.createLinearGradient(0, titleY - 20, 0, titleY + 20);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF6347');
    
    ctx.fillStyle = gradient;
    ctx.fillText('SELECT LEVEL', centerX, titleY);
  }

  private renderBackButton(ctx: CanvasRenderingContext2D): void {
    const button = this.backButton;
    
    // Button shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(button.x + 2, button.y + 2, button.width, button.height);
    
    // Button background
    ctx.fillStyle = this.backButtonHovered ? '#555' : '#333';
    ctx.fillRect(button.x, button.y, button.width, button.height);
    
    // Button border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    
    // Button text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('← BACK', button.x + button.width / 2, button.y + button.height / 2 + 6);
  }

  private renderLevelCards(ctx: CanvasRenderingContext2D): void {
    this.levelCards.forEach(card => {
      // Card shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(card.x + 3, card.y + 3, card.width, card.height);
      
      // Card background
      let cardColor = '#2C3E50';
      if (card.completed) {
        cardColor = '#27AE60'; // Green for completed
      } else if (card.level.id === this.gameStateManager.getCurrentLevel()) {
        cardColor = '#3498DB'; // Blue for current level
      }
      
      if (card.hovered) {
        cardColor = this.lightenColor(cardColor, 20);
      }
      
      ctx.fillStyle = cardColor;
      ctx.fillRect(card.x, card.y, card.width, card.height);
      
      // Card border
      ctx.strokeStyle = card.hovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = card.hovered ? 3 : 2;
      ctx.strokeRect(card.x, card.y, card.width, card.height);
      
      // Level number (large)
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        card.level.id.toString(),
        card.x + card.width / 2,
        card.y + 40
      );
      
      // Level name
      ctx.font = 'bold 14px Arial';
      ctx.fillText(
        card.level.name,
        card.x + card.width / 2,
        card.y + 65
      );
      
      // Level description (wrapped)
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.wrapText(ctx, card.level.description || '', card.x + card.width / 2, card.y + 85, card.width - 10, 14);
      
      // Completion indicator
      if (card.completed) {
        ctx.fillStyle = '#F1C40F';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('★', card.x + card.width - 20, card.y + 20);
      }
    });
  }

  private lightenColor(color: string, percent: number): string {
    // Simple color lightening - in a real app you'd use a proper color library
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  private renderInstructions(ctx: CanvasRenderingContext2D): void {
    const instructions = [
      'Click on any level to play it',
      'Press number keys (1-9) for quick selection',
      'Press ESC or click BACK to return to main menu'
    ];
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    instructions.forEach((instruction, index) => {
      ctx.fillText(
        instruction,
        this.canvas.width / 2,
        this.canvas.height - 60 + index * 18
      );
    });
  }
}
