import { Vector2 } from '@/types';
import { TrackSegment, TrackConnection, SplinePoint } from '@/types/railyard';

export class SplineTrackSystem {
  private tracks: Map<string, TrackSegment> = new Map();
  private connections: Map<string, string[]> = new Map(); // trackId -> connected trackIds

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
    
    console.log(`Added spline connection: ${connection.from} <-> ${connection.to}`);
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

  // Find track at position using spline-based collision detection
  public findTrackAtPosition(position: Vector2): TrackSegment | null {
    for (const track of this.tracks.values()) {
      if (this.isPositionOnSplineTrack(position, track)) {
        return track;
      }
    }
    return null;
  }

  // Check if position is on the spline track (within tolerance)
  private isPositionOnSplineTrack(position: Vector2, track: TrackSegment): boolean {
    const tolerance = 20; // Distance tolerance for track detection
    
    // Sample points along the spline and check distance
    for (let t = 0; t <= 1; t += 0.05) {
      const splinePoint = this.getPositionOnSpline(track.spline, t);
      const distance = this.calculateDistance(position, splinePoint);
      if (distance <= tolerance) {
        return true;
      }
    }
    return false;
  }

  // Get position along spline using parameter t (0-1)
  public getPositionOnSpline(spline: SplinePoint[], t: number): Vector2 {
    if (spline.length === 0) return { x: 0, y: 0 };
    if (spline.length === 1) return spline[0].position;
    
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t));
    
    if (spline.length === 2) {
      // Linear interpolation for 2 points
      return this.lerp(spline[0].position, spline[1].position, t);
    }
    
    // For more than 2 points, use Catmull-Rom spline
    return this.catmullRomSpline(spline, t);
  }

  // Linear interpolation between two points
  private lerp(p1: Vector2, p2: Vector2, t: number): Vector2 {
    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    };
  }

  // Catmull-Rom spline interpolation for smooth curves
  private catmullRomSpline(points: SplinePoint[], t: number): Vector2 {
    const n = points.length - 1;
    const segment = Math.floor(t * n);
    const localT = (t * n) - segment;
    
    // Get control points for this segment
    const p0 = points[Math.max(0, segment - 1)].position;
    const p1 = points[segment].position;
    const p2 = points[Math.min(n, segment + 1)].position;
    const p3 = points[Math.min(n, segment + 2)].position;
    
    // Catmull-Rom formula
    const t2 = localT * localT;
    const t3 = t2 * localT;
    
    return {
      x: 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * localT +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      ),
      y: 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * localT +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      )
    };
  }

  // Find closest point on spline to given position
  public findClosestPointOnSpline(spline: SplinePoint[], position: Vector2): { t: number; position: Vector2; distance: number } {
    let closestT = 0;
    let closestPosition = this.getPositionOnSpline(spline, 0);
    let closestDistance = this.calculateDistance(position, closestPosition);
    
    // Sample along the spline to find closest point
    for (let t = 0; t <= 1; t += 0.01) {
      const splinePos = this.getPositionOnSpline(spline, t);
      const distance = this.calculateDistance(position, splinePos);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestT = t;
        closestPosition = splinePos;
      }
    }
    
    return { t: closestT, position: closestPosition, distance: closestDistance };
  }

  // Get valid positions for dragging along connected splines
  public getValidMovePositions(fromTrackId: string, maxDistance: number = 3): Vector2[] {
    const positions: Vector2[] = [];
    const visited = new Set<string>();
    const queue: { trackId: string; distance: number }[] = [{ trackId: fromTrackId, distance: 0 }];
    
    console.log(`Getting valid spline positions from track: ${fromTrackId}`);
    
    while (queue.length > 0) {
      const { trackId, distance } = queue.shift()!;
      
      if (visited.has(trackId) || distance > maxDistance) continue;
      visited.add(trackId);
      
      const track = this.tracks.get(trackId);
      if (track) {
        // For the starting track (distance 0), always add positions even if occupied
        // For other tracks, only add if not occupied
        if (distance === 0 || !track.occupied) {
          console.log(`Adding spline positions for track ${trackId} (distance: ${distance}, occupied: ${track.occupied})`);
          
          // Sample positions along the spline
          for (let t = 0; t <= 1; t += 0.1) {
            const splinePos = this.getPositionOnSpline(track.spline, t);
            // Offset position to center the car
            positions.push({
              x: splinePos.x - 17.5, // Half car width
              y: splinePos.y - 12.5  // Half car height
            });
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
    
    console.log(`Found ${positions.length} valid spline positions`);
    return positions;
  }

  private calculateDistance(pos1: Vector2, pos2: Vector2): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
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

  // Get track bounds for rendering
  public getTrackBounds(track: TrackSegment): { min: Vector2; max: Vector2 } {
    if (track.spline.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }
    
    let minX = track.spline[0].position.x;
    let maxX = track.spline[0].position.x;
    let minY = track.spline[0].position.y;
    let maxY = track.spline[0].position.y;
    
    for (const point of track.spline) {
      minX = Math.min(minX, point.position.x);
      maxX = Math.max(maxX, point.position.x);
      minY = Math.min(minY, point.position.y);
      maxY = Math.max(maxY, point.position.y);
    }
    
    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY }
    };
  }

  // Convert position to parameter t along spline
  public positionToSplineParameter(track: TrackSegment, position: Vector2): number {
    const result = this.findClosestPointOnSpline(track.spline, position);
    return result.t;
  }
}
