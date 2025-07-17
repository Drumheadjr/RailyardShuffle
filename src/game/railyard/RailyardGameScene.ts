import { Scene, InputState } from '@/types';
import { GameStateManager } from '../GameStateManager';
import { GameStateType } from '@/types';
import { RailyardLevel, RailyardGameState, TrackType } from '@/types/railyard';
import { TrackSystem } from './TrackSystem';
import { TrainCarSystem } from './TrainCarSystem';
import { ExitSystem } from './ExitSystem';
import { LevelBuilder } from './LevelBuilder';
import { TRACK, TRAIN_CAR, COLORS } from '@/constants/railyard';

export abstract class BaseRailyardScene implements Scene {
  private gameStateManager: GameStateManager;
  private canvas: HTMLCanvasElement;
  private trackSystem: TrackSystem;
  private trainCarSystem: TrainCarSystem;
  private exitSystem: ExitSystem;
  private gameState!: RailyardGameState;
  private lastMouseDown: boolean = false;

  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.canvas = canvas;

    // Initialize systems
    this.trackSystem = new TrackSystem();
    this.trainCarSystem = new TrainCarSystem(this.trackSystem);
    this.exitSystem = new ExitSystem(
      this.trackSystem,
      this.trainCarSystem,
      { x: canvas.width, y: canvas.height }
    );

    // Load level configuration from subclass
    const levelConfig = this.getLevelConfig();
    const level = LevelBuilder.buildLevel(levelConfig);
    this.loadLevel(level);
  }

  // Abstract method that subclasses must implement
  protected abstract getLevelConfig(): any;

  private loadLevel(level: RailyardLevel): void {
    console.log(`Loading railyard level: ${level.name}`);
    
    // Clear existing data
    this.trackSystem = new TrackSystem();
    this.trainCarSystem = new TrainCarSystem(this.trackSystem);
    this.exitSystem = new ExitSystem(
      this.trackSystem,
      this.trainCarSystem,
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

    console.log(`Level loaded: ${level.tracks.length} tracks, ${level.trainCars.length} cars, ${level.exits.length} exits`);
  }

  public onEnter(): void {
    console.log('Entered Railyard Game Scene');
  }

  public onExit(): void {
    console.log('Exited Railyard Game Scene');
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
        console.log(`Starting drag for car: ${car.id}`);
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
      
      console.log('Level completed!');
      
      // Transition to level complete state after a delay
      setTimeout(() => {
        this.gameStateManager.nextLevel();
        this.gameStateManager.setState(GameStateType.LEVEL_COMPLETE);
      }, 2000);
    }
  }

  private resetLevel(): void {
    console.log('Resetting level...');
    this.loadLevel(this.gameState.level);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render tracks
    this.renderTracks(ctx);
    
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

  private renderTracks(ctx: CanvasRenderingContext2D): void {
    const tracks = this.trackSystem.getAllTracks();

    tracks.forEach(track => {
      // Track base
      ctx.fillStyle = track.occupied ? COLORS.TRACK_OCCUPIED : COLORS.TRACK_UNOCCUPIED;
      ctx.fillRect(track.position.x, track.position.y, track.size.x, track.size.y);

      // Track rails
      ctx.strokeStyle = COLORS.TRACK_RAILS;
      ctx.lineWidth = TRACK.RAIL_WIDTH;

      switch (track.type) {
        case TrackType.STRAIGHT_HORIZONTAL:
          ctx.beginPath();
          ctx.moveTo(track.position.x, track.position.y + TRACK.RAIL_OFFSET_1);
          ctx.lineTo(track.position.x + track.size.x, track.position.y + TRACK.RAIL_OFFSET_1);
          ctx.moveTo(track.position.x, track.position.y + TRACK.RAIL_OFFSET_2);
          ctx.lineTo(track.position.x + track.size.x, track.position.y + TRACK.RAIL_OFFSET_2);
          ctx.stroke();
          break;

        case TrackType.STRAIGHT_VERTICAL:
          ctx.beginPath();
          ctx.moveTo(track.position.x + TRACK.RAIL_OFFSET_1, track.position.y);
          ctx.lineTo(track.position.x + TRACK.RAIL_OFFSET_1, track.position.y + track.size.y);
          ctx.moveTo(track.position.x + TRACK.RAIL_OFFSET_2, track.position.y);
          ctx.lineTo(track.position.x + TRACK.RAIL_OFFSET_2, track.position.y + track.size.y);
          ctx.stroke();
          break;

        default:
          // Simple representation for curves and intersections
          ctx.strokeStyle = COLORS.TRACK_RAILS;
          ctx.lineWidth = TRACK.BORDER_WIDTH;
          ctx.strokeRect(
            track.position.x + TRACK.BORDER_OFFSET,
            track.position.y + TRACK.BORDER_OFFSET,
            track.size.x - TRACK.BORDER_OFFSET * 2,
            track.size.y - TRACK.BORDER_OFFSET * 2
          );
          break;
      }

      // Track ID removed for cleaner look
    });
  }

  private renderExits(ctx: CanvasRenderingContext2D): void {
    const exits = this.exitSystem.getAllExits();
    
    exits.forEach(exit => {
      // Exit background
      ctx.fillStyle = exit.color || '#32CD32';
      ctx.fillRect(exit.position.x, exit.position.y, exit.size.x, exit.size.y);
      
      // Exit border
      ctx.strokeStyle = '#228B22';
      ctx.lineWidth = 3;
      ctx.strokeRect(exit.position.x, exit.position.y, exit.size.x, exit.size.y);
      
      // Exit arrow
      ctx.fillStyle = 'white';
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(car.position.x + 2, car.position.y + 2, car.size.x, car.size.y);
      }
      
      // Car body
      ctx.fillStyle = car.color;
      ctx.fillRect(car.position.x, car.position.y, car.size.x, car.size.y);
      
      // Car border
      ctx.strokeStyle = car.isDragging ? '#FFD700' : '#000000';
      ctx.lineWidth = car.isDragging ? 3 : 2;
      ctx.strokeRect(car.position.x, car.position.y, car.size.x, car.size.y);
      
      // Car details
      ctx.fillStyle = 'white';
      ctx.fillRect(car.position.x + 5, car.position.y + 5, 5, 5);
      ctx.fillRect(car.position.x + car.size.x - 10, car.position.y + 5, 5, 5);
    });
  }

  private renderDragIndicators(ctx: CanvasRenderingContext2D): void {
    const dragState = this.trainCarSystem.getDragState();

    if (dragState.isDragging && dragState.validPositions.length > 0) {
      ctx.fillStyle = COLORS.DRAG_HIGHLIGHT;
      dragState.validPositions.forEach(pos => {
        ctx.fillRect(pos.x, pos.y, TRAIN_CAR.WIDTH, TRAIN_CAR.HEIGHT);
      });
    }
  }

  private renderUI(ctx: CanvasRenderingContext2D): void {
    const gameData = this.gameStateManager.getGameData();
    
    // Level info
    ctx.fillStyle = 'white';
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Drag train cars to move them along tracks', 20, this.canvas.height - 40);
    ctx.fillText('Press R to reset, ESC for menu', 20, this.canvas.height - 20);
  }

  private renderCompletionMessage(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Completion message
    ctx.fillStyle = '#32CD32';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('All trains reached their destinations!', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
}
