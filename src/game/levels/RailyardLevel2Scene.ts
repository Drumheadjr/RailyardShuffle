import { GameStateManager } from '../GameStateManager';
import { BaseRailyardScene } from '../railyard/RailyardGameScene';
import { LevelConfig, TrackType, ExitSide } from '@/types/railyard';
import { PLAY_AREA, TRACK, LEVEL, COLORS } from '@/constants/railyard';

export class RailyardLevel2Scene extends BaseRailyardScene {
  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    super(gameStateManager, canvas);
  }

  protected getLevelConfig(): LevelConfig {
    const trackY = PLAY_AREA.DEFAULT_HEIGHT / 2 - TRACK.SIZE / 2;
    const startX = 160;

    return {
      playArea: { width: PLAY_AREA.DEFAULT_WIDTH, height: PLAY_AREA.DEFAULT_HEIGHT },
      trackLayout: [
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX, y: trackY - TRACK.SPACING },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING, y: trackY - TRACK.SPACING },
        { type: TrackType.CURVE_TOP_RIGHT, x: startX + TRACK.SPACING * 2, y: trackY - TRACK.SPACING },
        { type: TrackType.STRAIGHT_VERTICAL, x: startX + TRACK.SPACING * 2, y: trackY },
        { type: TrackType.STRAIGHT_VERTICAL, x: startX + TRACK.SPACING * 2, y: trackY + TRACK.SPACING },
        { type: TrackType.CURVE_BOTTOM_LEFT, x: startX + TRACK.SPACING * 2, y: trackY + TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 3, y: trackY + TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 4, y: trackY + TRACK.SPACING * 2 }
      ],
      exits: [
        { side: ExitSide.LEFT, position: 0.3, trackConnection: 0, color: COLORS.CYAN },
        { side: ExitSide.RIGHT, position: 0.6, trackConnection: 7, color: COLORS.YELLOW }
      ],
      cars: [
        { trackIndex: 1, progress: LEVEL.CAR_PROGRESS_DEFAULT, color: COLORS.CYAN, targetExit: 0 },
        { trackIndex: 6, progress: LEVEL.CAR_PROGRESS_DEFAULT, color: COLORS.YELLOW, targetExit: 1 }
      ],
      objective: 'Move each colored car to its matching colored exit'
    };
  }
}
