import { Scene, InputState } from '@/types';
import { GameStateManager } from '../GameStateManager';
import { GameStateType } from '@/types';
import { RailyardLevel, RailyardGameState, TrainCar } from '@/types/railyard';
import { SplineTrackSystem } from './SplineTrackSystem';
import { SplineTrainCarSystem } from './SplineTrainCarSystem';
import { LocomotiveSystem } from './LocomotiveSystem';
import { SplineLevelBuilder, SplineLevelConfig } from './SplineLevelBuilder';
import { COLORS, LOCOMOTIVE } from '@/constants/railyard';
import { AssetManager } from '@/utils/AssetManager';
import { BaseLinkableEntitySystem } from './BaseLinkableEntitySystem';

export abstract class BaseSplineRailyardScene implements Scene {
  private gameStateManager: GameStateManager;
  private canvas: HTMLCanvasElement;
  private trackSystem: SplineTrackSystem;
  private trainCarSystem: SplineTrainCarSystem;
  private locomotiveSystem: LocomotiveSystem;
  private gameState!: RailyardGameState;
  private lastMouseDown: boolean = false;
  private assetManager: AssetManager;
  private boxcarImageLoaded: boolean = false;

  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    this.gameStateManager = gameStateManager;
    this.canvas = canvas;

    // Initialize spline-based systems
    this.trackSystem = new SplineTrackSystem();
    this.trainCarSystem = new SplineTrainCarSystem(this.trackSystem);
    this.locomotiveSystem = new LocomotiveSystem(this.trackSystem);

    // Initialize asset manager and load boxcar image
    this.assetManager = AssetManager.getInstance();
    this.loadBoxcarImage();

    // Load level configuration from subclass
    const levelConfig = this.getSplineLevelConfig();
    const level = SplineLevelBuilder.buildLevel(levelConfig);
    this.loadLevel(level);
  }

  // Abstract method that subclasses must implement
  protected abstract getSplineLevelConfig(): SplineLevelConfig;

  // Load the boxcar image asset
  private async loadBoxcarImage(): Promise<void> {
    try {
      const boxcarImage = await this.assetManager.loadBoxcarImage();
      this.boxcarImageLoaded = true;
      console.log(`✅ Boxcar image loaded successfully: ${boxcarImage.width}x${boxcarImage.height} (aspect ratio: ${(boxcarImage.width / boxcarImage.height).toFixed(2)}:1)`);
    } catch (error) {
      console.warn('❌ Failed to load boxcar image, falling back to rectangle rendering:', error);
      this.boxcarImageLoaded = false;
    }
  }

  private loadLevel(level: RailyardLevel): void {
    console.log(`Loading spline railyard level: ${level.name}`);

    // Clear existing data
    this.trackSystem = new SplineTrackSystem();
    this.trainCarSystem = new SplineTrainCarSystem(this.trackSystem);
    this.locomotiveSystem = new LocomotiveSystem(this.trackSystem);

    // Load tracks
    level.tracks.forEach(track => {
      this.trackSystem.addTrack(track);
    });

    // Load connections
    level.connections.forEach(connection => {
      this.trackSystem.addConnection(connection);
    });

    // Load locomotives
    level.locomotives.forEach(locomotive => {
      console.log(`Loading locomotive: ${locomotive.id}`);
      this.locomotiveSystem.addLocomotive(locomotive);
      this.trainCarSystem.addLocomotive(locomotive); // Also add to train car system for linking
    });

    // Load train cars
    level.trainCars.forEach(car => {
      console.log(`Loading car: ${car.id} with target locomotive: ${car.targetLocomotive}`);
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

    console.log(`Spline level loaded: ${level.tracks.length} tracks, ${level.trainCars.length} cars, ${level.locomotives.length} locomotives`);
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

      // Check for train cars first
      const car = this.trainCarSystem.getCarAtPosition(input.mouse.position);
      if (car && !car.isCompleted) {
        console.log(`Starting spline drag for car: ${car.id}`);
        this.trainCarSystem.startDrag(car.id, input.mouse.position);
      } else {
        // Check for locomotives if no car was found
        const locomotive = this.locomotiveSystem.getEntityAtPosition(input.mouse.position);
        if (locomotive) {
          console.log(`Starting spline drag for locomotive: ${locomotive.id}`);
          this.locomotiveSystem.startDrag(locomotive.id, input.mouse.position);
        } else {
          console.log('No car or locomotive found at position');
        }
      }
    }

    // Update drag for whichever system is currently dragging
    if (input.mouse.isDown) {
      const activeDragSystem = this.getActiveDragSystem();
      if (activeDragSystem) {
        activeDragSystem.updateDrag(input.mouse.position);
      }
    }

    // End drag for whichever system is currently dragging
    if (mouseClicked) {
      const activeDragSystem = this.getActiveDragSystem();
      if (activeDragSystem) {
        activeDragSystem.endDrag();
      }
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
    this.locomotiveSystem.update(deltaTime);

    // Check for level completion
    this.checkLevelCompletion();
  }

  // Car-locomotive linking now handled automatically during drag operations

  private checkLevelCompletion(): void {
    const requiredConnections = this.gameState.level.objectives.requiredConnections;
    console.log(`Required connections for level completion:`, requiredConnections);

    const isComplete = this.locomotiveSystem.checkLevelCompletion(requiredConnections);

    if (isComplete && !this.gameState.isLevelComplete) {
      this.gameState.isLevelComplete = true;
      this.gameState.score += 1000;
      this.gameStateManager.updateScore(this.gameState.score);

      console.log('🎉 Spline level completed!');

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

    // Render locomotives
    this.renderLocomotives(ctx);

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

  private renderLocomotives(ctx: CanvasRenderingContext2D): void {
    const locomotives = this.locomotiveSystem.getAllLocomotives();

    locomotives.forEach(locomotive => {
      // Locomotive shadow
      if (!locomotive.isDragging) {
        ctx.fillStyle = COLORS.CAR_SHADOW;
        ctx.fillRect(locomotive.position.x + 2, locomotive.position.y + 2, locomotive.size.x, locomotive.size.y);
      }

      // Locomotive body (slightly different styling than regular cars)
      ctx.fillStyle = locomotive.color;
      ctx.fillRect(locomotive.position.x, locomotive.position.y, locomotive.size.x, locomotive.size.y);

      // Locomotive border (thicker than regular cars)
      ctx.strokeStyle = locomotive.isActive ? COLORS.CAR_BORDER_NORMAL : COLORS.CAR_BORDER_DRAGGING;
      ctx.lineWidth = 3;
      ctx.strokeRect(locomotive.position.x, locomotive.position.y, locomotive.size.x, locomotive.size.y);

      // Locomotive details (chimney and front)
      ctx.fillStyle = COLORS.CAR_DETAILS;
      // Chimney
      ctx.fillRect(locomotive.position.x + 5, locomotive.position.y - 3, LOCOMOTIVE.CHIMNEY_WIDTH, LOCOMOTIVE.CHIMNEY_HEIGHT);
      // Front detail
      ctx.fillRect(locomotive.position.x + locomotive.size.x - 8, locomotive.position.y + LOCOMOTIVE.FRONT_DETAIL_MARGIN, LOCOMOTIVE.FRONT_DETAIL_WIDTH, locomotive.size.y - 10);

      // Connection indicator if locomotive has linked cars
      if (locomotive.linkedCars.length > 0) {
        ctx.fillStyle = COLORS.COMPLETION_SUCCESS;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${locomotive.linkedCars.length}`,
          locomotive.position.x + locomotive.size.x / 2,
          locomotive.position.y + locomotive.size.y / 2 + 4);
      }
    });
  }

  private renderTrainCars(ctx: CanvasRenderingContext2D): void {
    const cars = this.trainCarSystem.getAllCars();

    // First, render linking connections
    this.renderCarLinks(ctx, cars);

    cars.forEach(car => {
      // Car shadow
      if (!car.isDragging) {
        ctx.fillStyle = COLORS.CAR_SHADOW;
        ctx.fillRect(car.position.x + 2, car.position.y + 2, car.size.x, car.size.y);
      }

      // Render car using boxcar image if loaded, otherwise use rectangle
      if (this.boxcarImageLoaded) {
        const boxcarImage = this.assetManager.getImage('boxcar');
        if (boxcarImage) {
          // Draw boxcar image with white background removal and color tinting
          this.assetManager.drawImageWithColorTint(
            ctx,
            boxcarImage,
            car.position.x,
            car.position.y,
            car.size.x,
            car.size.y,
            car.color,
            240 // White threshold
          );
        } else {
          // Fallback to rectangle if image failed to load
          this.renderCarAsRectangle(ctx, car);
        }
      } else {
        // Fallback to rectangle rendering
        this.renderCarAsRectangle(ctx, car);
      }

      // Car border (highlight if linked)
      const isLinked = car.linkedCars.length > 0;
      ctx.strokeStyle = car.isDragging ? COLORS.CAR_BORDER_DRAGGING :
                       isLinked ? COLORS.COMPLETION_SUCCESS : COLORS.CAR_BORDER_NORMAL;
      ctx.lineWidth = car.isDragging ? 3 : isLinked ? 3 : 2;
      ctx.strokeRect(car.position.x, car.position.y, car.size.x, car.size.y);

      // Link indicator
      if (isLinked) {
        ctx.fillStyle = COLORS.COMPLETION_SUCCESS;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔗', car.position.x + car.size.x / 2, car.position.y - 5);
      }
    });
  }

  // Helper method to render car as rectangle (fallback)
  private renderCarAsRectangle(ctx: CanvasRenderingContext2D, car: TrainCar): void {
    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(car.position.x, car.position.y, car.size.x, car.size.y);

    // Car details
    ctx.fillStyle = COLORS.CAR_DETAILS;
    ctx.fillRect(car.position.x + 5, car.position.y + 5, 5, 5);
    ctx.fillRect(car.position.x + car.size.x - 10, car.position.y + 5, 5, 5);
  }

  // Helper method to get the currently active drag system
  private getActiveDragSystem(): BaseLinkableEntitySystem | null {
    if (this.trainCarSystem.getDragState().isDragging) {
      return this.trainCarSystem;
    } else if (this.locomotiveSystem.getDragState().isDragging) {
      return this.locomotiveSystem;
    }
    return null;
  }

  private renderCarLinks(ctx: CanvasRenderingContext2D, cars: TrainCar[]): void {
    const renderedLinks = new Set<string>();

    cars.forEach(car => {
      car.linkedCars.forEach(linkedCarId => {
        // Create a unique key for this link to avoid rendering twice
        const linkKey = [car.id, linkedCarId].sort().join('-');
        if (renderedLinks.has(linkKey)) return;
        renderedLinks.add(linkKey);

        const linkedCar = cars.find(c => c.id === linkedCarId);
        if (!linkedCar) return;

        // Draw connection line between cars
        ctx.strokeStyle = COLORS.COMPLETION_SUCCESS;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        const car1Center = {
          x: car.position.x + car.size.x / 2,
          y: car.position.y + car.size.y / 2
        };

        const car2Center = {
          x: linkedCar.position.x + linkedCar.size.x / 2,
          y: linkedCar.position.y + linkedCar.size.y / 2
        };

        ctx.beginPath();
        ctx.moveTo(car1Center.x, car1Center.y);
        ctx.lineTo(car2Center.x, car2Center.y);
        ctx.stroke();

        // Draw connection points
        ctx.fillStyle = COLORS.COMPLETION_SUCCESS;
        ctx.beginPath();
        ctx.arc(car1Center.x, car1Center.y, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(car2Center.x, car2Center.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
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
