import { GameStateManager } from '../GameStateManager';
import { BaseRailyardScene } from '../railyard/RailyardGameScene';
import { LevelConfig, TrackType, ExitSide } from '@/types/railyard';
import { PLAY_AREA, TRACK, LEVEL, COLORS } from '@/constants/railyard';

export class RailyardLevel3Scene extends BaseRailyardScene {
  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    super(gameStateManager, canvas);
  }

  protected getLevelConfig(): LevelConfig {
    const trackY = PLAY_AREA.DEFAULT_HEIGHT / 2 - TRACK.SIZE / 2;
    const startX = 100;

    return {
      playArea: { width: PLAY_AREA.DEFAULT_WIDTH, height: PLAY_AREA.DEFAULT_HEIGHT },
      trackLayout: [
        // Top horizontal track
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX, y: trackY - TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING, y: trackY - TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 2, y: trackY - TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 3, y: trackY - TRACK.SPACING * 2 },

        // Middle horizontal track
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 2, y: trackY },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 3, y: trackY },

        // Bottom horizontal track
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX, y: trackY + TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING, y: trackY + TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 2, y: trackY + TRACK.SPACING * 2 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: startX + TRACK.SPACING * 3, y: trackY + TRACK.SPACING * 2 }
      ],
      exits: [
        { side: ExitSide.RIGHT, position: 0.2, trackConnection: 3, color: COLORS.RED },
        { side: ExitSide.RIGHT, position: 0.5, trackConnection: 7, color: COLORS.BLUE },
        { side: ExitSide.RIGHT, position: 0.8, trackConnection: 11, color: COLORS.GREEN }
      ],
      cars: [
        { trackIndex: 0, progress: LEVEL.CAR_PROGRESS_DEFAULT, color: COLORS.RED, targetExit: 0 },
        { trackIndex: 4, progress: LEVEL.CAR_PROGRESS_DEFAULT, color: COLORS.BLUE, targetExit: 1 },
        { trackIndex: 8, progress: LEVEL.CAR_PROGRESS_DEFAULT, color: COLORS.GREEN, targetExit: 2 }
      ],
      objective: 'Sort three trains: red, blue, and green cars to their matching exits'
    };
  }
}
