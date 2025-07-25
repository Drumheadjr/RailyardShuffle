import { GameStateManager } from '../GameStateManager';
import { BaseSplineRailyardScene } from '../railyard/SplineRailyardScene';
import { SplineLevelConfig } from '../railyard/SplineLevelBuilder';
import { TrainCarType } from '@/types/railyard';
import { PLAY_AREA, COLORS } from '@/constants/railyard';

export class RailyardLevel1Scene extends BaseSplineRailyardScene {
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
          id: 'red_locomotive',
          trackId: 'main_track',
          progress: 0.9, // Near the right end
          color: COLORS.RED,
          acceptedCarTypes: [TrainCarType.REGULAR],
          maxCars: 2
        }
      ],
      cars: [
        {
          trackId: 'main_track',
          progress: 0.1, // Start near the left
          color: COLORS.RED,
          type: TrainCarType.REGULAR,
          targetLocomotive: 'red_locomotive'
        },
        {
          trackId: 'main_track',
          progress: 0.25, // Close to the first car for easy linking
          color: COLORS.RED,
          type: TrainCarType.REGULAR,
          targetLocomotive: 'red_locomotive'
        }
      ],
      objective: 'Link the train cars together and connect them to the red locomotive'
    };
  }
}
