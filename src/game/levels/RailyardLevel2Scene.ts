import { GameStateManager } from "../GameStateManager";
import { BaseSplineRailyardScene } from "../railyard/SplineRailyardScene";
import { SplineLevelConfig } from "../railyard/SplineLevelBuilder";
import { TrainCarType } from "@/types/railyard";
import { PLAY_AREA, COLORS } from "@/constants/railyard";

export class RailyardLevel2Scene extends BaseSplineRailyardScene {
  constructor(gameStateManager: GameStateManager, canvas: HTMLCanvasElement) {
    super(gameStateManager, canvas);
  }

  protected getSplineLevelConfig(): SplineLevelConfig {
    const startX = 0;
    const endX = PLAY_AREA.DEFAULT_WIDTH;
    const startY = PLAY_AREA.DEFAULT_HEIGHT * 0.3; // Start at 30% from top
    const endY = PLAY_AREA.DEFAULT_HEIGHT * 0.7; // End at 70% from top
    const midX = PLAY_AREA.DEFAULT_WIDTH / 2;

    return {
      playArea: {
        width: PLAY_AREA.DEFAULT_WIDTH,
        height: PLAY_AREA.DEFAULT_HEIGHT,
      },
      tracks: [
        {
          id: "main_track",
          type: "CURVE" as any,
          points: [
            { x: startX, y: startY }, // Start point (top-left area)
            { x: midX * 0.7, y: endY }, // First control point (bottom-left curve)
            { x: midX * 1.3, y: startY }, // Second control point (top-right curve)
            { x: endX, y: endY }, // End point (bottom-right area)
          ],
          connections: [],
        },
      ],
      locomotives: [
        {
          id: "blue_locomotive",
          trackId: "main_track",
          progress: 0.75, // On the curve towards the end
          color: COLORS.BLUE,
          acceptedCarTypes: [TrainCarType.REGULAR, TrainCarType.CARGO],
          maxCars: 3,
          isDraggable: false, // This locomotive is NOT draggable
        },
        {
          id: "red_locomotive",
          trackId: "main_track",
          progress: 0.9, // Near the end of the S-curve
          color: COLORS.RED,
          acceptedCarTypes: [TrainCarType.REGULAR],
          maxCars: 2,
          isDraggable: true, // This locomotive IS draggable
        },
      ],
      cars: [
        {
          trackId: "main_track",
          progress: 0.1, // Start of the S-curve (top-left)
          color: COLORS.RED,
          type: TrainCarType.REGULAR,
          targetLocomotive: "red_locomotive",
          isDraggable: true, // This car IS draggable
        },
        {
          trackId: "main_track",
          progress: 0.3, // First curve section (going down)
          color: COLORS.BLUE,
          type: TrainCarType.CARGO,
          targetLocomotive: "blue_locomotive",
          isDraggable: false, // This car is NOT draggable
        },
        {
          trackId: "main_track",
          progress: 0.5, // Middle of the S-curve
          color: COLORS.RED,
          type: TrainCarType.REGULAR,
          targetLocomotive: "red_locomotive",
          isDraggable: true, // This car IS draggable
        },
      ],
      objective:
        "Navigate the S-curve track! Red cars and red locomotive are draggable, blue car and blue locomotive are not draggable",
    };
  }
}
