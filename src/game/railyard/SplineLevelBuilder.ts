import { Vector2 } from '@/types';
import {
  RailyardLevel,
  TrackSegment,
  TrackConnection,
  TrainCar,
  Locomotive,
  TrainCarType,
  TrackType,
  Direction,
  SplinePoint
} from '@/types/railyard';
import { TRAIN_CAR } from '@/constants/railyard';

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
  locomotives: {
    id: string;
    trackId: string;
    progress: number; // 0-1 along track spline
    color?: string;
    acceptedCarTypes?: TrainCarType[];
    maxCars?: number;
  }[];
  cars: {
    trackId: string;
    progress: number; // 0-1 along track spline
    color: string;
    type?: TrainCarType;
    targetLocomotive?: string; // Locomotive ID
  }[];
  objective: string;
}

export class SplineLevelBuilder {
  public static buildLevel(config: SplineLevelConfig): RailyardLevel {
    const tracks: TrackSegment[] = [];
    const connections: TrackConnection[] = [];
    const locomotives: Locomotive[] = [];
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

    // Build locomotives
    config.locomotives.forEach(locoConfig => {
      const track = tracks.find(t => t.id === locoConfig.trackId);
      if (track) {
        // Calculate position along spline
        const splinePos = this.getPositionOnSpline(track.spline, locoConfig.progress);

        const locomotive: Locomotive = {
          id: locoConfig.id,
          type: TrainCarType.LOCOMOTIVE,
          position: {
            x: splinePos.x - 22.5, // Half locomotive width (45/2)
            y: splinePos.y - 15    // Half locomotive height (30/2)
          },
          size: { x: 45, y: 30 },
          currentTrack: track.id,
          trackProgress: locoConfig.progress,
          color: locoConfig.color || '#2C3E50',
          isDragging: false,
          isCompleted: false,
          linkedCars: [],
          acceptedCarTypes: locoConfig.acceptedCarTypes || [TrainCarType.REGULAR],
          connectedCars: [],
          maxCars: locoConfig.maxCars || 3,
          isActive: true
        };
        locomotives.push(locomotive);
        track.occupied = true;
      }
    });

    // Build train cars
    config.cars.forEach((carConfig, index) => {
      const track = tracks.find(t => t.id === carConfig.trackId);
      if (track) {
        // Calculate position along spline
        const splinePos = this.getPositionOnSpline(track.spline, carConfig.progress);

        const trainCar: TrainCar = {
          id: carConfig.trackId + '_car_' + index, // Unique ID generation
          type: (carConfig.type as TrainCarType.REGULAR | TrainCarType.CARGO | TrainCarType.PASSENGER) || TrainCarType.REGULAR,
          position: {
            x: splinePos.x - TRAIN_CAR.WIDTH / 2,
            y: splinePos.y - TRAIN_CAR.HEIGHT / 2
          },
          size: { x: TRAIN_CAR.WIDTH, y: TRAIN_CAR.HEIGHT },
          currentTrack: track.id,
          trackProgress: carConfig.progress,
          color: carConfig.color,
          isDragging: false,
          isCompleted: false,
          linkedCars: [],
          targetLocomotive: carConfig.targetLocomotive
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
      locomotives,
      trainCars,
      objectives: {
        description: config.objective,
        requiredConnections: config.cars
          .filter(car => car.targetLocomotive)
          .map((car, index) => ({
            carId: car.trackId + '_car_' + index,
            locomotiveId: car.targetLocomotive!
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

  // Exit-related methods removed - using locomotives instead

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
