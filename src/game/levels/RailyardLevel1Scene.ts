import { GameStateManager } from '../GameStateManager';
import { BaseRailyardScene } from '../railyard/RailyardGameScene';
import { LevelConfig, TrackType, ExitSide } from '@/types/railyard';
import { PLAY_AREA, TRACK, LEVEL, COLORS } from '@/constants/railyard';

export class RailyardLevel1Scene extends BaseRailyardScene {
  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    super(gameStateManager, canvas);
  }

  protected getLevelConfig(): LevelConfig {
    const trackY = PLAY_AREA.DEFAULT_HEIGHT / 2 - TRACK.SIZE / 2; // Center vertically
    const startX = 100;

    return {
      playArea: { width: PLAY_AREA.DEFAULT_WIDTH, height: PLAY_AREA.DEFAULT_HEIGHT },
      trackLayout: [
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 2, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 3, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 4, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 5, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 6, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 7, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 8, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 9, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 10, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 11, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 12, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 13, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 14, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 15, y: trackY }
      ],
      exits: [
        { side: ExitSide.RIGHT, position: LEVEL.EXIT_POSITION_DEFAULT, trackConnection: 15, color: COLORS.RED }
      ],
      cars: [
        { trackIndex: 0, progress: LEVEL.CAR_PROGRESS_DEFAULT, color: COLORS.RED, targetExit: 0 }
      ],
      objective: 'Drag the red train car to the red exit on the right'
    };
  }
}
