import { GameStateManager } from '../GameStateManager';
import { BaseSplineRailyardScene } from '../railyard/SplineRailyardScene';
import { SplineLevelConfig } from '../railyard/SplineLevelBuilder';
import { TrainCarType } from '@/types/railyard';
import { PLAY_AREA, COLORS } from '@/constants/railyard';

export class RailyardLevel2Scene extends BaseSplineRailyardScene {
  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    super(gameStateManager, canvas);
  }

  protected getSplineLevelConfig(): SplineLevelConfig {
    const trackY = PLAY_AREA.DEFAULT_HEIGHT / 2;
    const startX = 0;
    const endX = PLAY_AREA.DEFAULT_WIDTH;

    return {
      playArea: { width: PLAY_AREA.DEFAULT_WIDTH, height: PLAY_AREA.DEFAULT_HEIGHT },
      tracks: [
        {
          id: 'main_track',
          type: 'STRAIGHT' as any,
          points: [
            { x: startX, y: trackY },
            { x: endX, y: trackY }
          ],
          connections: []
        }
      ],
      locomotives: [
        {
          id: 'blue_locomotive',
          trackId: 'main_track',
          progress: 0.8, // Near the right end
          color: COLORS.BLUE,
          acceptedCarTypes: [TrainCarType.REGULAR, TrainCarType.CARGO],
          maxCars: 3,
          isDraggable: false // This locomotive is NOT draggable
        },
        {
          id: 'red_locomotive',
          trackId: 'main_track',
          progress: 0.9, // Near the right end
          color: COLORS.RED,
          acceptedCarTypes: [TrainCarType.REGULAR],
          maxCars: 2,
          isDraggable: true // This locomotive IS draggable
        }
      ],
      cars: [
        {
          trackId: 'main_track',
          progress: 0.1, // Start near the left
          color: COLORS.RED,
          type: TrainCarType.REGULAR,
          targetLocomotive: 'red_locomotive',
          isDraggable: true // This car IS draggable
        },
        {
          trackId: 'main_track',
          progress: 0.25, // Close to the first car
          color: COLORS.BLUE,
          type: TrainCarType.CARGO,
          targetLocomotive: 'blue_locomotive',
          isDraggable: false // This car is NOT draggable
        },
        {
          trackId: 'main_track',
          progress: 0.4, // Middle area
          color: COLORS.RED,
          type: TrainCarType.REGULAR,
          targetLocomotive: 'red_locomotive',
          isDraggable: true // This car IS draggable
        }
      ],
      objective: 'Test level: Red cars and red locomotive are draggable, blue car and blue locomotive are not draggable'
    };
  }
}
