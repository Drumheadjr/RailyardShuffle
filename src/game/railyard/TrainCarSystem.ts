import { Vector2 } from '@/types';
import { TrainCar, TrackSegment, DragState } from '@/types/railyard';
import { TrackSystem } from './TrackSystem';

export class TrainCarSystem {
  private cars: Map<string, TrainCar> = new Map();
  private trackSystem: TrackSystem;
  private dragState: DragState;

  constructor(trackSystem: TrackSystem) {
    this.trackSystem = trackSystem;
    this.dragState = {
      isDragging: false,
      draggedCar: null,
      dragOffset: { x: 0, y: 0 },
      validPositions: []
    };
  }

  public addCar(car: TrainCar): void {
    this.cars.set(car.id, car);
    
    // If car is on a track, mark it as occupied
    if (car.currentTrack) {
      this.trackSystem.setTrackOccupied(car.currentTrack, true);
    }
  }

  public getCar(id: string): TrainCar | undefined {
    return this.cars.get(id);
  }

  public getAllCars(): TrainCar[] {
    return Array.from(this.cars.values());
  }

  public startDrag(carId: string, mousePosition: Vector2): boolean {
    const car = this.cars.get(carId);
    if (!car || car.isAtExit) return false;

    // Calculate drag offset
    this.dragState.dragOffset = {
      x: mousePosition.x - car.position.x,
      y: mousePosition.y - car.position.y
    };

    // Get valid positions for this car
    if (car.currentTrack) {
      this.dragState.validPositions = this.trackSystem.getValidMovePositions(car.currentTrack, 5);
      console.log(`Found ${this.dragState.validPositions.length} valid positions for car ${carId}`);
    } else {
      this.dragState.validPositions = [];
      console.log(`Car ${carId} has no current track`);
    }

    this.dragState.isDragging = true;
    this.dragState.draggedCar = car;
    car.isDragging = true;

    console.log(`Started dragging car ${carId}`);
    return true;
  }

  public updateDrag(mousePosition: Vector2): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const car = this.dragState.draggedCar;
    
    // Calculate target position
    const targetPosition = {
      x: mousePosition.x - this.dragState.dragOffset.x,
      y: mousePosition.y - this.dragState.dragOffset.y
    };

    // Find the closest valid track position
    const validPosition = this.findClosestValidPosition(targetPosition);
    
    if (validPosition) {
      car.position = validPosition;
      
      // Update track assignment
      const newTrack = this.trackSystem.findTrackAtPosition(validPosition);
      if (newTrack && newTrack.id !== car.currentTrack) {
        // Clear old track
        if (car.currentTrack) {
          this.trackSystem.setTrackOccupied(car.currentTrack, false);
        }
        
        // Check if new track is available
        if (!this.isTrackOccupiedByOtherCar(newTrack.id, car.id)) {
          car.currentTrack = newTrack.id;
          car.trackProgress = this.calculateTrackProgress(newTrack, validPosition);
          this.trackSystem.setTrackOccupied(newTrack.id, true);
        }
      }
    }
  }

  public endDrag(): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const car = this.dragState.draggedCar;
    car.isDragging = false;

    // Snap to final track position
    if (car.currentTrack) {
      const track = this.trackSystem.getTrack(car.currentTrack);
      if (track) {
        car.position = this.trackSystem.getPositionOnTrack(track, car.trackProgress);
      }
    }

    console.log(`Ended dragging car ${car.id}`);

    // Reset drag state
    this.dragState.isDragging = false;
    this.dragState.draggedCar = null;
    this.dragState.validPositions = [];
  }

  private findClosestValidPosition(targetPosition: Vector2): Vector2 | null {
    if (this.dragState.validPositions.length === 0) return null;

    let closestPosition = this.dragState.validPositions[0];
    let closestDistance = this.calculateDistance(targetPosition, closestPosition);

    for (const position of this.dragState.validPositions) {
      const distance = this.calculateDistance(targetPosition, position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPosition = position;
      }
    }

    return closestPosition;
  }

  private calculateDistance(pos1: Vector2, pos2: Vector2): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  private calculateTrackProgress(track: TrackSegment, position: Vector2): number {
    // Calculate how far along the track this position is (0-1)
    // const trackCenter = this.trackSystem.getTrackCenter(track); // Reserved for future use
    
    switch (track.type) {
      case 'STRAIGHT_HORIZONTAL':
        return Math.max(0, Math.min(1, (position.x - track.position.x) / track.size.x));
      
      case 'STRAIGHT_VERTICAL':
        return Math.max(0, Math.min(1, (position.y - track.position.y) / track.size.y));
      
      default:
        // For curves and intersections, use distance from start
        return 0.5; // Default to middle
    }
  }

  private isTrackOccupiedByOtherCar(trackId: string, excludeCarId: string): boolean {
    for (const car of this.cars.values()) {
      if (car.id !== excludeCarId && car.currentTrack === trackId) {
        return true;
      }
    }
    return false;
  }

  public getCarAtPosition(position: Vector2): TrainCar | null {
    console.log(`Checking car at position: ${position.x}, ${position.y}`);
    for (const car of this.cars.values()) {
      console.log(`Car ${car.id} at: ${car.position.x}, ${car.position.y}, size: ${car.size.x}x${car.size.y}`);
      if (this.isPositionOnCar(position, car)) {
        console.log(`Found car ${car.id} at position`);
        return car;
      }
    }
    console.log('No car found at position');
    return null;
  }

  private isPositionOnCar(position: Vector2, car: TrainCar): boolean {
    return position.x >= car.position.x &&
           position.x <= car.position.x + car.size.x &&
           position.y >= car.position.y &&
           position.y <= car.position.y + car.size.y;
  }

  public moveCar(carId: string, targetTrackId: string, progress: number = 0.5): boolean {
    const car = this.cars.get(carId);
    const targetTrack = this.trackSystem.getTrack(targetTrackId);
    
    if (!car || !targetTrack) return false;
    
    // Check if target track is available
    if (this.isTrackOccupiedByOtherCar(targetTrackId, carId)) {
      return false;
    }

    // Clear current track
    if (car.currentTrack) {
      this.trackSystem.setTrackOccupied(car.currentTrack, false);
    }

    // Move to new track
    car.currentTrack = targetTrackId;
    car.trackProgress = Math.max(0, Math.min(1, progress));
    car.position = this.trackSystem.getPositionOnTrack(targetTrack, car.trackProgress);
    
    // Mark new track as occupied
    this.trackSystem.setTrackOccupied(targetTrackId, true);

    return true;
  }

  public canMoveCar(carId: string, targetTrackId: string): boolean {
    const car = this.cars.get(carId);
    if (!car || !car.currentTrack) return false;

    // Check if there's a path from current track to target track
    const path = this.trackSystem.findPath(car.currentTrack, targetTrackId);
    if (!path) return false;

    // Check if all tracks in path are available (except current)
    for (let i = 1; i < path.segments.length; i++) {
      const trackId = path.segments[i];
      if (this.isTrackOccupiedByOtherCar(trackId, carId)) {
        return false;
      }
    }

    return true;
  }

  public getDragState(): DragState {
    return { ...this.dragState };
  }

  public update(deltaTime: number): void {
    // Update car animations, physics, etc.
    for (const car of this.cars.values()) {
      if (!car.isDragging && car.currentTrack) {
        // Ensure car is properly positioned on track
        const track = this.trackSystem.getTrack(car.currentTrack);
        if (track) {
          const targetPosition = this.trackSystem.getPositionOnTrack(track, car.trackProgress);
          
          // Smooth movement to correct position
          const lerpFactor = Math.min(1, deltaTime * 0.01);
          car.position.x += (targetPosition.x - car.position.x) * lerpFactor;
          car.position.y += (targetPosition.y - car.position.y) * lerpFactor;
        }
      }
    }
  }

  public removeCar(carId: string): void {
    const car = this.cars.get(carId);
    if (car) {
      // Clear track occupation
      if (car.currentTrack) {
        this.trackSystem.setTrackOccupied(car.currentTrack, false);
      }
      
      this.cars.delete(carId);
    }
  }
}
