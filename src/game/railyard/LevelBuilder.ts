import { Vector2 } from '@/types';
import {
  RailyardLevel,
  LevelConfig,
  TrackSegment,
  TrackConnection,
  TrainCar,
  Exit,
  TrackType,
  Direction,
  ExitSide
} from '@/types/railyard';
import { TRACK, TRAIN_CAR, EXIT, PLAY_AREA, LEVEL, COLORS } from '@/constants/railyard';

export class LevelBuilder {

  public static buildLevel(config: LevelConfig): RailyardLevel {
    const tracks: TrackSegment[] = [];
    const connections: TrackConnection[] = [];
    const exits: Exit[] = [];
    const trainCars: TrainCar[] = [];

    // Build tracks
    config.trackLayout.forEach((trackConfig, index) => {
      const track: TrackSegment = {
        id: `track_${index}`,
        type: trackConfig.type,
        position: { x: trackConfig.x, y: trackConfig.y },
        size: { x: TRACK.SIZE, y: TRACK.SIZE },
        connections: trackConfig.connections || this.getDefaultConnections(trackConfig.type),
        occupied: false
      };
      tracks.push(track);
    });

    // Build connections between adjacent tracks
    this.buildConnections(tracks, connections);
    console.log(`Built ${connections.length} track connections`);

    // Build exits
    config.exits.forEach((exitConfig, index) => {
      const connectedTrack = tracks[exitConfig.trackConnection];
      if (connectedTrack) {
        const exit: Exit = {
          id: `exit_${index}`,
          side: exitConfig.side,
          position: this.calculateExitPosition(exitConfig.side, exitConfig.position, config.playArea),
          size: this.calculateExitSize(exitConfig.side),
          connectedTrack: connectedTrack.id,
          color: exitConfig.color
        };
        exits.push(exit);
      }
    });

    // Build train cars
    config.cars.forEach((carConfig, index) => {
      const track = tracks[carConfig.trackIndex];
      if (track) {
        const position = this.calculateCarPosition(track, carConfig.progress);
        const trainCar: TrainCar = {
          id: `car_${index}`,
          position,
          size: { x: TRAIN_CAR.WIDTH, y: TRAIN_CAR.HEIGHT },
          currentTrack: track.id,
          trackProgress: carConfig.progress,
          color: carConfig.color,
          isDragging: false,
          isAtExit: false,
          targetExit: carConfig.targetExit !== undefined ? `exit_${carConfig.targetExit}` : undefined
        };
        trainCars.push(trainCar);
        track.occupied = true;
      }
    });

    return {
      id: 1,
      name: 'Generated Level',
      description: config.objective,
      playArea: config.playArea,
      tracks,
      connections,
      exits,
      trainCars,
      objectives: {
        description: config.objective,
        requiredExits: config.cars
          .filter(car => car.targetExit !== undefined)
          .map(car => ({
            carId: `car_${config.cars.indexOf(car)}`,
            exitId: `exit_${car.targetExit!}`
          }))
      }
    };
  }

  private static getDefaultConnections(trackType: TrackType): Direction[] {
    switch (trackType) {
      case TrackType.STRAIGHT_HORIZONTAL:
        return [Direction.EAST, Direction.WEST];
      case TrackType.STRAIGHT_VERTICAL:
        return [Direction.NORTH, Direction.SOUTH];
      case TrackType.CURVE_TOP_LEFT:
        return [Direction.SOUTH, Direction.EAST];
      case TrackType.CURVE_TOP_RIGHT:
        return [Direction.SOUTH, Direction.WEST];
      case TrackType.CURVE_BOTTOM_LEFT:
        return [Direction.NORTH, Direction.EAST];
      case TrackType.CURVE_BOTTOM_RIGHT:
        return [Direction.NORTH, Direction.WEST];
      case TrackType.INTERSECTION:
        return [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];
      default:
        return [];
    }
  }

  private static buildConnections(tracks: TrackSegment[], connections: TrackConnection[]): void {
    for (let i = 0; i < tracks.length; i++) {
      for (let j = i + 1; j < tracks.length; j++) {
        const track1 = tracks[i];
        const track2 = tracks[j];
        
        // Check if tracks are adjacent
        const connection = this.findConnection(track1, track2);
        if (connection) {
          connections.push(connection);
        }
      }
    }
  }

  private static findConnection(track1: TrackSegment, track2: TrackSegment): TrackConnection | null {
    const dx = track2.position.x - track1.position.x;
    const dy = track2.position.y - track1.position.y;

    // Check if tracks are adjacent (exactly one track size apart)
    if ((Math.abs(dx) === TRACK.SIZE && dy === 0) || (Math.abs(dy) === TRACK.SIZE && dx === 0)) {
      let fromDirection: Direction;
      let toDirection: Direction;

      // Determine connection directions
      if (dx > 0) {
        fromDirection = Direction.EAST;
        toDirection = Direction.WEST;
      } else if (dx < 0) {
        fromDirection = Direction.WEST;
        toDirection = Direction.EAST;
      } else if (dy > 0) {
        fromDirection = Direction.SOUTH;
        toDirection = Direction.NORTH;
      } else {
        fromDirection = Direction.NORTH;
        toDirection = Direction.SOUTH;
      }

      // Check if both tracks support these connections
      if (track1.connections.includes(fromDirection) && track2.connections.includes(toDirection)) {
        console.log(`Connection found: ${track1.id} -> ${track2.id} (${fromDirection} -> ${toDirection})`);
        return {
          from: track1.id,
          to: track2.id,
          fromDirection,
          toDirection
        };
      } else {
        console.log(`Connection blocked: ${track1.id} -> ${track2.id} (${fromDirection} -> ${toDirection}) - track1 has [${track1.connections}], track2 has [${track2.connections}]`);
      }
    }

    return null;
  }

  private static calculateExitPosition(side: ExitSide, positionPercent: number, playArea: { width: number; height: number }): Vector2 {
    const exitWidth = EXIT.WIDTH;
    const exitHeight = EXIT.HEIGHT;
    
    switch (side) {
      case ExitSide.TOP:
        return {
          x: positionPercent * (playArea.width - exitWidth),
          y: -exitHeight / 2
        };
      case ExitSide.BOTTOM:
        return {
          x: positionPercent * (playArea.width - exitWidth),
          y: playArea.height - exitHeight / 2
        };
      case ExitSide.LEFT:
        return {
          x: -exitWidth / 2,
          y: positionPercent * (playArea.height - exitHeight)
        };
      case ExitSide.RIGHT:
        return {
          x: playArea.width - exitWidth,
          y: positionPercent * (playArea.height - exitHeight)
        };
      default:
        return { x: 0, y: 0 };
    }
  }

  private static calculateExitSize(side: ExitSide): Vector2 {
    const exitWidth = EXIT.WIDTH;
    const exitHeight = EXIT.HEIGHT;
    
    switch (side) {
      case ExitSide.TOP:
      case ExitSide.BOTTOM:
        return { x: exitWidth, y: exitHeight };
      case ExitSide.LEFT:
      case ExitSide.RIGHT:
        return { x: exitHeight, y: exitWidth };
      default:
        return { x: exitWidth, y: exitHeight };
    }
  }

  private static calculateCarPosition(track: TrackSegment, progress: number): Vector2 {
    // Calculate position along track based on progress (0-1)
    const carOffsetX = TRAIN_CAR.WIDTH / 2;
    const carOffsetY = TRAIN_CAR.HEIGHT / 2;

    switch (track.type) {
      case TrackType.STRAIGHT_HORIZONTAL:
        return {
          x: track.position.x + progress * track.size.x - carOffsetX,
          y: track.position.y + track.size.y / 2 - carOffsetY
        };
      case TrackType.STRAIGHT_VERTICAL:
        return {
          x: track.position.x + track.size.x / 2 - carOffsetX,
          y: track.position.y + progress * track.size.y - carOffsetY
        };
      default:
        // For curves and intersections, place at center
        return {
          x: track.position.x + track.size.x / 2 - carOffsetX,
          y: track.position.y + track.size.y / 2 - carOffsetY
        };
    }
  }

  // Predefined level configurations
  public static getLevel1Config(): LevelConfig {
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

  public static getLevel2Config(): LevelConfig {
    return {
      playArea: { width: 800, height: 600 },
      trackLayout: [
        { type: TrackType.STRAIGHT_HORIZONTAL, x: 160, y: 200 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: 200, y: 200 },
        { type: TrackType.CURVE_TOP_RIGHT, x: 240, y: 200 },
        { type: TrackType.STRAIGHT_VERTICAL, x: 240, y: 240 },
        { type: TrackType.STRAIGHT_VERTICAL, x: 240, y: 280 },
        { type: TrackType.CURVE_BOTTOM_LEFT, x: 240, y: 320 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: 280, y: 320 },
        { type: TrackType.STRAIGHT_HORIZONTAL, x: 320, y: 320 }
      ],
      exits: [
        { side: ExitSide.LEFT, position: 0.3, trackConnection: 0, color: '#4ECDC4' },
        { side: ExitSide.RIGHT, position: 0.6, trackConnection: 7, color: '#FFE66D' }
      ],
      cars: [
        { trackIndex: 1, progress: 0.5, color: '#4ECDC4', targetExit: 0 },
        { trackIndex: 6, progress: 0.5, color: '#FFE66D', targetExit: 1 }
      ],
      objective: 'Move each colored car to its matching colored exit'
    };
  }
}
