import { Vector2 } from '@/types';
import { TrackSegment, TrackConnection, Direction, TrackType, PathNode, TrackPath } from '@/types/railyard';
import { CALC } from '@/constants/railyard';

export class TrackSystem {
  private tracks: Map<string, TrackSegment> = new Map();
  private connections: Map<string, string[]> = new Map(); // trackId -> connected trackIds
  // private trackSize: number = 40; // Standard track segment size - reserved for future use

  constructor() {}

  public addTrack(track: TrackSegment): void {
    this.tracks.set(track.id, track);
    if (!this.connections.has(track.id)) {
      this.connections.set(track.id, []);
    }
  }

  public addConnection(connection: TrackConnection): void {
    // Add bidirectional connection
    const fromConnections = this.connections.get(connection.from) || [];
    const toConnections = this.connections.get(connection.to) || [];

    if (!fromConnections.includes(connection.to)) {
      fromConnections.push(connection.to);
    }
    if (!toConnections.includes(connection.from)) {
      toConnections.push(connection.from);
    }

    this.connections.set(connection.from, fromConnections);
    this.connections.set(connection.to, toConnections);

    console.log(`Added connection: ${connection.from} <-> ${connection.to}`);
  }

  public getTrack(id: string): TrackSegment | undefined {
    return this.tracks.get(id);
  }

  public getAllTracks(): TrackSegment[] {
    return Array.from(this.tracks.values());
  }

  public getConnectedTracks(trackId: string): string[] {
    return this.connections.get(trackId) || [];
  }

  public findTrackAtPosition(position: Vector2): TrackSegment | null {
    for (const track of this.tracks.values()) {
      if (this.isPositionOnTrack(position, track)) {
        return track;
      }
    }
    return null;
  }

  public isPositionOnTrack(position: Vector2, track: TrackSegment): boolean {
    return position.x >= track.position.x &&
           position.x <= track.position.x + track.size.x &&
           position.y >= track.position.y &&
           position.y <= track.position.y + track.size.y;
  }

  public getTrackCenter(track: TrackSegment): Vector2 {
    return {
      x: track.position.x + track.size.x / 2,
      y: track.position.y + track.size.y / 2
    };
  }

  public getPositionOnTrack(track: TrackSegment, progress: number): Vector2 {
    // Progress is 0-1 along the track
    const center = this.getTrackCenter(track);

    switch (track.type) {
      case TrackType.STRAIGHT_HORIZONTAL:
        return {
          x: track.position.x + progress * track.size.x,
          y: center.y - CALC.CAR_OFFSET_Y
        };

      case TrackType.STRAIGHT_VERTICAL:
        return {
          x: center.x - CALC.CAR_OFFSET_X,
          y: track.position.y + progress * track.size.y
        };

      case TrackType.CURVE_TOP_LEFT:
      case TrackType.CURVE_TOP_RIGHT:
      case TrackType.CURVE_BOTTOM_LEFT:
      case TrackType.CURVE_BOTTOM_RIGHT:
        return this.getCurvePosition(track, progress);

      case TrackType.INTERSECTION:
        return {
          x: center.x - CALC.CAR_OFFSET_X,
          y: center.y - CALC.CAR_OFFSET_Y
        };

      default:
        return {
          x: center.x - CALC.CAR_OFFSET_X,
          y: center.y - CALC.CAR_OFFSET_Y
        };
    }
  }

  private getCurvePosition(track: TrackSegment, progress: number): Vector2 {
    const center = this.getTrackCenter(track);
    const radius = Math.min(track.size.x, track.size.y) / 2;
    
    // Calculate angle based on curve type and progress
    let startAngle: number;
    let endAngle: number;
    
    switch (track.type) {
      case TrackType.CURVE_TOP_LEFT:
        startAngle = 0; // East
        endAngle = Math.PI / 2; // South
        break;
      case TrackType.CURVE_TOP_RIGHT:
        startAngle = Math.PI / 2; // South
        endAngle = Math.PI; // West
        break;
      case TrackType.CURVE_BOTTOM_LEFT:
        startAngle = -Math.PI / 2; // North
        endAngle = 0; // East
        break;
      case TrackType.CURVE_BOTTOM_RIGHT:
        startAngle = Math.PI; // West
        endAngle = -Math.PI / 2; // North
        break;
      default:
        return center;
    }
    
    const angle = startAngle + (endAngle - startAngle) * progress;
    return {
      x: center.x + Math.cos(angle) * radius * 0.7,
      y: center.y + Math.sin(angle) * radius * 0.7
    };
  }

  public findPath(fromTrackId: string, toTrackId: string): TrackPath | null {
    if (fromTrackId === toTrackId) {
      return {
        segments: [fromTrackId],
        totalDistance: 0,
        directions: []
      };
    }

    const visited = new Set<string>();
    const queue: PathNode[] = [];
    
    // Start from the source track
    const startTrack = this.tracks.get(fromTrackId);
    if (!startTrack) return null;
    
    queue.push({
      trackId: fromTrackId,
      position: this.getTrackCenter(startTrack),
      direction: Direction.NORTH, // Will be updated
      distance: 0,
      parent: null
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.trackId === toTrackId) {
        // Reconstruct path
        const path: string[] = [];
        let node: PathNode | null = current;
        
        while (node) {
          path.unshift(node.trackId);
          node = node.parent;
        }
        
        return {
          segments: path,
          totalDistance: current.distance,
          directions: this.calculateDirections(path)
        };
      }
      
      if (visited.has(current.trackId)) continue;
      visited.add(current.trackId);
      
      // Explore connected tracks
      const connectedTracks = this.getConnectedTracks(current.trackId);
      for (const connectedId of connectedTracks) {
        if (visited.has(connectedId)) continue;
        
        const connectedTrack = this.tracks.get(connectedId);
        if (!connectedTrack) continue;
        
        const connectedCenter = this.getTrackCenter(connectedTrack);
        const distance = current.distance + this.calculateDistance(current.position, connectedCenter);
        
        queue.push({
          trackId: connectedId,
          position: connectedCenter,
          direction: this.calculateDirection(current.position, connectedCenter),
          distance,
          parent: current
        });
      }
      
      // Sort queue by distance (simple pathfinding)
      queue.sort((a, b) => a.distance - b.distance);
    }
    
    return null; // No path found
  }

  private calculateDistance(pos1: Vector2, pos2: Vector2): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  private calculateDirection(from: Vector2, to: Vector2): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? Direction.EAST : Direction.WEST;
    } else {
      return dy > 0 ? Direction.SOUTH : Direction.NORTH;
    }
  }

  private calculateDirections(path: string[]): Direction[] {
    const directions: Direction[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const currentTrack = this.tracks.get(path[i]);
      const nextTrack = this.tracks.get(path[i + 1]);
      
      if (currentTrack && nextTrack) {
        const currentCenter = this.getTrackCenter(currentTrack);
        const nextCenter = this.getTrackCenter(nextTrack);
        directions.push(this.calculateDirection(currentCenter, nextCenter));
      }
    }
    
    return directions;
  }

  public setTrackOccupied(trackId: string, occupied: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.occupied = occupied;
    }
  }

  public isTrackOccupied(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    return track ? track.occupied : false;
  }

  public getValidMovePositions(fromTrackId: string, maxDistance: number = 3): Vector2[] {
    const positions: Vector2[] = [];
    const visited = new Set<string>();
    const queue: { trackId: string; distance: number }[] = [{ trackId: fromTrackId, distance: 0 }];

    console.log(`Getting valid positions from track: ${fromTrackId}`);
    console.log(`Track connections for ${fromTrackId}:`, this.getConnectedTracks(fromTrackId));

    while (queue.length > 0) {
      const { trackId, distance } = queue.shift()!;

      if (visited.has(trackId) || distance > maxDistance) continue;
      visited.add(trackId);

      const track = this.tracks.get(trackId);
      if (track) {
        // For the starting track (distance 0), always add positions even if occupied
        // For other tracks, only add if not occupied
        if (distance === 0 || !track.occupied) {
          console.log(`Adding positions for track ${trackId} (distance: ${distance}, occupied: ${track.occupied})`);
          // Add multiple positions along this track
          for (let progress = 0; progress <= 1; progress += 0.25) {
            positions.push(this.getPositionOnTrack(track, progress));
          }
        }

        // Always explore connected tracks regardless of occupation
        const connected = this.getConnectedTracks(trackId);
        console.log(`Track ${trackId} connected to:`, connected);
        for (const connectedId of connected) {
          if (!visited.has(connectedId)) {
            queue.push({ trackId: connectedId, distance: distance + 1 });
          }
        }
      }
    }

    console.log(`Found ${positions.length} valid positions`);
    return positions;
  }
}
