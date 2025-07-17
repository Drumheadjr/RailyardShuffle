import { Vector2 } from './index';

export enum TrackType {
  STRAIGHT = 'STRAIGHT',
  CURVE = 'CURVE',
  INTERSECTION = 'INTERSECTION',
  SWITCH = 'SWITCH'
}

export enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST'
}

export enum ExitSide {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

// Spline control point for smooth curves
export interface SplinePoint {
  position: Vector2;
  tangent?: Vector2; // Optional tangent for curve control
}

export interface TrackSegment {
  id: string;
  type: TrackType;
  spline: SplinePoint[]; // Array of control points defining the track path
  connections: Direction[];
  occupied: boolean;
  // Legacy support - will be removed
  position?: Vector2;
  size?: Vector2;
}

export interface TrackConnection {
  from: string; // Track segment ID
  to: string;   // Track segment ID
  fromDirection: Direction;
  toDirection: Direction;
}

export interface TrainCar {
  id: string;
  position: Vector2;
  size: Vector2;
  currentTrack: string | null;
  trackProgress: number; // 0-1, position along the track
  color: string;
  isDragging: boolean;
  isAtExit: boolean;
  targetExit?: string;
}

export interface Exit {
  id: string;
  side: ExitSide;
  position: Vector2;
  size: Vector2;
  connectedTrack: string;
  color?: string;
  acceptedCarColors?: string[];
}

export interface RailyardLevel {
  id: number;
  name: string;
  description: string;
  playArea: {
    width: number;
    height: number;
  };
  tracks: TrackSegment[];
  connections: TrackConnection[];
  exits: Exit[];
  trainCars: TrainCar[];
  objectives: {
    description: string;
    requiredExits: { carId: string; exitId: string }[];
  };
}

export interface DragState {
  isDragging: boolean;
  draggedCar: TrainCar | null;
  dragOffset: Vector2;
  validPositions: Vector2[];
}

export interface RailyardGameState {
  level: RailyardLevel;
  dragState: DragState;
  completedCars: string[];
  isLevelComplete: boolean;
  score: number;
}

// Utility types for track pathfinding
export interface PathNode {
  trackId: string;
  position: Vector2;
  direction: Direction;
  distance: number;
  parent: PathNode | null;
}

export interface TrackPath {
  segments: string[];
  totalDistance: number;
  directions: Direction[];
}

// Configuration for creating levels
export interface LevelConfig {
  playArea: { width: number; height: number };
  trackLayout: {
    type: TrackType;
    x: number;
    y: number;
    connections?: Direction[];
  }[];
  exits: {
    side: ExitSide;
    position: number; // 0-1 along the side
    trackConnection: number; // Index in trackLayout
    color?: string;
  }[];
  cars: {
    trackIndex: number;
    progress: number; // 0-1 along track
    color: string;
    targetExit?: number; // Index in exits
  }[];
  objective: string;
}
