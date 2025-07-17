import { Vector2 } from '@/types';
import { 
  RailyardLevel, 
  TrackSegment, 
  TrackConnection, 
  TrainCar, 
  Exit,
  TrackType,
  Direction,
  ExitSide,
  SplinePoint
} from '@/types/railyard';
import { TRAIN_CAR, EXIT } from '@/constants/railyard';

// Simplified configuration for spline-based tracks
export interface SplineTrackConfig {
  id: string;
  type: TrackType;
  points: Vector2[]; // Control points for the spline
  connections?: string[]; // IDs of connected tracks
}

export interface SplineLevelConfig {
  playArea: { width: number; height: number };
  tracks: SplineTrackConfig[];
  exits: {
    id: string;
    side: ExitSide;
    position: number; // 0-1 along the side
    connectedTrack: string; // Track ID
    color?: string;
  }[];
  cars: {
    trackId: string;
    progress: number; // 0-1 along track spline
    color: string;
    targetExit?: string; // Exit ID
  }[];
  objective: string;
}

export class SplineLevelBuilder {
  public static buildLevel(config: SplineLevelConfig): RailyardLevel {
    const tracks: TrackSegment[] = [];
    const connections: TrackConnection[] = [];
    const exits: Exit[] = [];
    const trainCars: TrainCar[] = [];

    // Build tracks with splines
    config.tracks.forEach(trackConfig => {
      const splinePoints: SplinePoint[] = trackConfig.points.map(point => ({
        position: point
      }));

      const track: TrackSegment = {
        id: trackConfig.id,
        type: trackConfig.type,
        spline: splinePoints,
        connections: this.getDefaultConnections(trackConfig.type),
        occupied: false
      };
      tracks.push(track);
    });

    // Build connections based on track configuration
    config.tracks.forEach(trackConfig => {
      if (trackConfig.connections) {
        trackConfig.connections.forEach(connectedId => {
          // Only add connection if it doesn't already exist
          const existingConnection = connections.find(conn => 
            (conn.from === trackConfig.id && conn.to === connectedId) ||
            (conn.from === connectedId && conn.to === trackConfig.id)
          );
          
          if (!existingConnection) {
            connections.push({
              from: trackConfig.id,
              to: connectedId,
              fromDirection: Direction.EAST, // Simplified - splines handle direction
              toDirection: Direction.WEST
            });
          }
        });
      }
    });

    // Build exits
    config.exits.forEach(exitConfig => {
      const exit: Exit = {
        id: exitConfig.id,
        side: exitConfig.side,
        position: this.calculateExitPosition(exitConfig.side, exitConfig.position, config.playArea),
        size: this.calculateExitSize(exitConfig.side),
        connectedTrack: exitConfig.connectedTrack,
        color: exitConfig.color
      };
      exits.push(exit);
    });

    // Build train cars
    config.cars.forEach(carConfig => {
      const track = tracks.find(t => t.id === carConfig.trackId);
      if (track) {
        // Calculate position along spline
        const splinePos = this.getPositionOnSpline(track.spline, carConfig.progress);
        
        const trainCar: TrainCar = {
          id: carConfig.trackId + '_car', // Simple ID generation
          position: {
            x: splinePos.x - TRAIN_CAR.WIDTH / 2,
            y: splinePos.y - TRAIN_CAR.HEIGHT / 2
          },
          size: { x: TRAIN_CAR.WIDTH, y: TRAIN_CAR.HEIGHT },
          currentTrack: track.id,
          trackProgress: carConfig.progress,
          color: carConfig.color,
          isDragging: false,
          isAtExit: false,
          targetExit: carConfig.targetExit
        };
        trainCars.push(trainCar);
        track.occupied = true;
      }
    });

    return {
      id: 1,
      name: 'Spline Level',
      description: config.objective,
      playArea: config.playArea,
      tracks,
      connections,
      exits,
      trainCars,
      objectives: {
        description: config.objective,
        requiredExits: config.cars
          .filter(car => car.targetExit)
          .map(car => ({
            carId: car.trackId + '_car',
            exitId: car.targetExit!
          }))
      }
    };
  }

  private static getDefaultConnections(trackType: TrackType): Direction[] {
    switch (trackType) {
      case TrackType.STRAIGHT:
        return [Direction.EAST, Direction.WEST];
      case TrackType.CURVE:
        return [Direction.NORTH, Direction.EAST];
      case TrackType.INTERSECTION:
        return [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];
      case TrackType.SWITCH:
        return [Direction.NORTH, Direction.SOUTH, Direction.EAST];
      default:
        return [];
    }
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

  // Simple linear interpolation for spline position calculation
  private static getPositionOnSpline(spline: SplinePoint[], t: number): Vector2 {
    if (spline.length === 0) return { x: 0, y: 0 };
    if (spline.length === 1) return spline[0].position;
    
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t));
    
    if (spline.length === 2) {
      // Linear interpolation for 2 points
      const p1 = spline[0].position;
      const p2 = spline[1].position;
      return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
      };
    }
    
    // For multiple points, find the segment and interpolate
    const segmentCount = spline.length - 1;
    const segment = Math.floor(t * segmentCount);
    const localT = (t * segmentCount) - segment;
    
    const p1 = spline[Math.min(segment, spline.length - 1)].position;
    const p2 = spline[Math.min(segment + 1, spline.length - 1)].position;
    
    return {
      x: p1.x + (p2.x - p1.x) * localT,
      y: p1.y + (p2.y - p1.y) * localT
    };
  }

  // Helper methods for creating common track shapes
  public static createStraightTrack(id: string, start: Vector2, end: Vector2): SplineTrackConfig {
    return {
      id,
      type: TrackType.STRAIGHT,
      points: [start, end]
    };
  }

  public static createCurvedTrack(id: string, start: Vector2, control: Vector2, end: Vector2): SplineTrackConfig {
    return {
      id,
      type: TrackType.CURVE,
      points: [start, control, end]
    };
  }

  public static createSmoothCurve(id: string, start: Vector2, end: Vector2, curvature: number = 0.5): SplineTrackConfig {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Create control point offset perpendicular to the line
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const perpX = -dy * curvature;
    const perpY = dx * curvature;
    
    const control = { x: midX + perpX, y: midY + perpY };
    
    return {
      id,
      type: TrackType.CURVE,
      points: [start, control, end]
    };
  }
}
