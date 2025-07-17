import { Scene, InputState } from '@/types';
import { GameStateManager } from '../GameStateManager';
import { GameStateType } from '@/types';
import { RailyardLevel, RailyardGameState } from '@/types/railyard';
import { SplineTrackSystem } from './SplineTrackSystem';
import { SplineTrainCarSystem } from './SplineTrainCarSystem';
import { ExitSystem } from './ExitSystem';
import { SplineLevelBuilder, SplineLevelConfig } from './SplineLevelBuilder';
import { COLORS } from '@/constants/railyard';

export abstract class BaseSplineRailyardScene implements Scene {
  private gameStateManager: GameStateManager;
  private canvas: HTMLCanvasElement;
  private trackSystem: SplineTrackSystem;
  private trainCarSystem: SplineTrainCarSystem;
  private exitSystem: ExitSystem;
  private gameState!: RailyardGameState;
  private lastMouseDown: boolean = false;

  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.canvas = canvas;
    
    // Initialize spline-based systems
    this.trackSystem = new SplineTrackSystem();
    this.trainCarSystem = new SplineTrainCarSystem(this.trackSystem);
    this.exitSystem = new ExitSystem(
      this.trackSystem as any, // Type compatibility - ExitSystem needs updating
      this.trainCarSystem as any, 
      { x: canvas.width, y: canvas.height }
    );
    
    // Load level configuration from subclass
    const levelConfig = this.getSplineLevelConfig();
    const level = SplineLevelBuilder.buildLevel(levelConfig);
    this.loadLevel(level);
  }

  // Abstract method that subclasses must implement
  protected abstract getSplineLevelConfig(): SplineLevelConfig;

  private loadLevel(level: RailyardLevel): void {
    console.log(`Loading spline railyard level: ${level.name}`);
    
    // Clear existing data
    this.trackSystem = new SplineTrackSystem();
    this.trainCarSystem = new SplineTrainCarSystem(this.trackSystem);
    this.exitSystem = new ExitSystem(
      this.trackSystem as any,
      this.trainCarSystem as any,
      { x: level.playArea.width, y: level.playArea.height }
    );

    // Load tracks
    level.tracks.forEach(track => {
      this.trackSystem.addTrack(track);
    });

    // Load connections
    level.connections.forEach(connection => {
      this.trackSystem.addConnection(connection);
    });

    // Load exits
    level.exits.forEach(exit => {
      this.exitSystem.addExit(exit);
    });

    // Load train cars
    level.trainCars.forEach(car => {
      this.trainCarSystem.addCar(car);
    });

    // Initialize game state
    this.gameState = {
      level,
      dragState: {
        isDragging: false,
        draggedCar: null,
        dragOffset: { x: 0, y: 0 },
        validPositions: []
      },
      completedCars: [],
      isLevelComplete: false,
      score: 0
    };

    console.log(`Spline level loaded: ${level.tracks.length} tracks, ${level.trainCars.length} cars, ${level.exits.length} exits`);
  }

  public onEnter(): void {
    console.log('Entered Spline Railyard Game Scene');
  }

  public onExit(): void {
    console.log('Exited Spline Railyard Game Scene');
  }

  public handleInput(input: InputState): void {
    // Detect mouse click
    const mouseClicked = !input.mouse.isDown && this.lastMouseDown;
    const mousePressed = input.mouse.isDown && !this.lastMouseDown;
    this.lastMouseDown = input.mouse.isDown;

    // Handle dragging
    if (mousePressed) {
      console.log(`Mouse pressed at: ${input.mouse.position.x}, ${input.mouse.position.y}`);
      const car = this.trainCarSystem.getCarAtPosition(input.mouse.position);
      if (car && !car.isAtExit) {
        console.log(`Starting spline drag for car: ${car.id}`);
        this.trainCarSystem.startDrag(car.id, input.mouse.position);
      } else {
        console.log('No car found or car is at exit');
      }
    }

    if (input.mouse.isDown && this.trainCarSystem.getDragState().isDragging) {
      this.trainCarSystem.updateDrag(input.mouse.position);
    }

    if (mouseClicked && this.trainCarSystem.getDragState().isDragging) {
      this.trainCarSystem.endDrag();
    }

    // Keyboard shortcuts
    if (input.keys.has('Escape')) {
      this.gameStateManager.setState(GameStateType.MAIN_MENU);
    }

    if (input.keys.has('KeyR')) {
      this.resetLevel();
    }
  }

  public update(deltaTime: number): void {
    if (this.gameState.isLevelComplete) return;

    // Update systems
    this.trainCarSystem.update(deltaTime);
    this.exitSystem.update(deltaTime);

    // Check for level completion
    this.checkLevelCompletion();
  }

  private checkLevelCompletion(): void {
    const isComplete = this.exitSystem.isLevelComplete(this.gameState.level.objectives.requiredExits);
    
    if (isComplete && !this.gameState.isLevelComplete) {
      this.gameState.isLevelComplete = true;
      this.gameState.score += 1000;
      this.gameStateManager.updateScore(this.gameState.score);
      
      console.log('Spline level completed!');
      
      // Transition to level complete state after a delay
      setTimeout(() => {
        this.gameStateManager.nextLevel();
        this.gameStateManager.setState(GameStateType.LEVEL_COMPLETE);
      }, 2000);
    }
  }

  private resetLevel(): void {
    console.log('Resetting spline level...');
    this.loadLevel(this.gameState.level);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render spline tracks
    this.renderSplineTracks(ctx);
    
    // Render exits
    this.renderExits(ctx);
    
    // Render train cars
    this.renderTrainCars(ctx);
    
    // Render drag indicators
    this.renderDragIndicators(ctx);
    
    // Render UI
    this.renderUI(ctx);
    
    // Render completion message
    if (this.gameState.isLevelComplete) {
      this.renderCompletionMessage(ctx);
    }
  }

  private renderSplineTracks(ctx: CanvasRenderingContext2D): void {
    const tracks = this.trackSystem.getAllTracks();
    
    tracks.forEach(track => {
      // Render spline as smooth curve
      if (track.spline.length >= 2) {
        ctx.strokeStyle = track.occupied ? COLORS.TRACK_OCCUPIED : COLORS.TRACK_UNOCCUPIED;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        // Sample points along the spline for smooth rendering
        const samples = 50;
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          const pos = this.trackSystem.getPositionOnSpline(track.spline, t);
          
          if (i === 0) {
            ctx.moveTo(pos.x, pos.y);
          } else {
            ctx.lineTo(pos.x, pos.y);
          }
        }
        
        ctx.stroke();
        
        // Render rail lines
        ctx.strokeStyle = COLORS.TRACK_RAILS;
        ctx.lineWidth = 2;
        
        // Draw parallel rail lines
        for (let offset of [-6, 6]) {
          ctx.beginPath();
          for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const pos = this.trackSystem.getPositionOnSpline(track.spline, t);
            
            // Calculate perpendicular offset for rail lines
            let perpX = 0, perpY = offset;
            if (i < samples) {
              const nextT = (i + 1) / samples;
              const nextPos = this.trackSystem.getPositionOnSpline(track.spline, nextT);
              const dx = nextPos.x - pos.x;
              const dy = nextPos.y - pos.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              if (length > 0) {
                perpX = (-dy / length) * offset;
                perpY = (dx / length) * offset;
              }
            }
            
            const railPos = { x: pos.x + perpX, y: pos.y + perpY };
            
            if (i === 0) {
              ctx.moveTo(railPos.x, railPos.y);
            } else {
              ctx.lineTo(railPos.x, railPos.y);
            }
          }
          ctx.stroke();
        }
      }
    });
  }

  private renderExits(ctx: CanvasRenderingContext2D): void {
    const exits = this.exitSystem.getAllExits();
    
    exits.forEach(exit => {
      // Exit background
      ctx.fillStyle = exit.color || COLORS.EXIT_DEFAULT;
      ctx.fillRect(exit.position.x, exit.position.y, exit.size.x, exit.size.y);
      
      // Exit border
      ctx.strokeStyle = COLORS.EXIT_BORDER;
      ctx.lineWidth = 3;
      ctx.strokeRect(exit.position.x, exit.position.y, exit.size.x, exit.size.y);
      
      // Exit arrow
      ctx.fillStyle = COLORS.EXIT_ARROW;
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('→', exit.position.x + exit.size.x / 2, exit.position.y + exit.size.y / 2 + 7);
    });
  }

  private renderTrainCars(ctx: CanvasRenderingContext2D): void {
    const cars = this.trainCarSystem.getAllCars();
    
    cars.forEach(car => {
      // Car shadow
      if (!car.isDragging) {
        ctx.fillStyle = COLORS.CAR_SHADOW;
        ctx.fillRect(car.position.x + 2, car.position.y + 2, car.size.x, car.size.y);
      }
      
      // Car body
      ctx.fillStyle = car.color;
      ctx.fillRect(car.position.x, car.position.y, car.size.x, car.size.y);
      
      // Car border
      ctx.strokeStyle = car.isDragging ? COLORS.CAR_BORDER_DRAGGING : COLORS.CAR_BORDER_NORMAL;
      ctx.lineWidth = car.isDragging ? 3 : 2;
      ctx.strokeRect(car.position.x, car.position.y, car.size.x, car.size.y);
      
      // Car details
      ctx.fillStyle = COLORS.CAR_DETAILS;
      ctx.fillRect(car.position.x + 5, car.position.y + 5, 5, 5);
      ctx.fillRect(car.position.x + car.size.x - 10, car.position.y + 5, 5, 5);
    });
  }

  private renderDragIndicators(ctx: CanvasRenderingContext2D): void {
    const dragState = this.trainCarSystem.getDragState();
    
    if (dragState.isDragging && dragState.validPositions.length > 0) {
      ctx.fillStyle = COLORS.DRAG_HIGHLIGHT;
      dragState.validPositions.forEach(pos => {
        ctx.fillRect(pos.x, pos.y, 35, 25);
      });
    }
  }

  private renderUI(ctx: CanvasRenderingContext2D): void {
    const gameData = this.gameStateManager.getGameData();
    
    // Level info
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${gameData.currentLevel}: ${this.gameState.level.name}`, 20, 40);
    
    // Objective
    ctx.font = '16px Arial';
    ctx.fillText(this.gameState.level.objectives.description, 20, 70);
    
    // Score
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${gameData.score}`, 20, this.canvas.height - 60);
    
    // Instructions
    ctx.font = '14px Arial';
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.fillText('Drag train cars along spline tracks', 20, this.canvas.height - 40);
    ctx.fillText('Press R to reset, ESC for menu', 20, this.canvas.height - 20);
  }

  private renderCompletionMessage(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    ctx.fillStyle = COLORS.COMPLETION_OVERLAY;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Completion message
    ctx.fillStyle = COLORS.COMPLETION_SUCCESS;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '24px Arial';
    ctx.fillText('All trains reached their destinations!', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
}
