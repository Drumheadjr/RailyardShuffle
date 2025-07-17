import { Vector2 } from '@/types';
import { TrainCar, DragState } from '@/types/railyard';
import { SplineTrackSystem } from './SplineTrackSystem';

export class SplineTrainCarSystem {
  private cars: Map<string, TrainCar> = new Map();
  private trackSystem: SplineTrackSystem;
  private dragState: DragState;

  constructor(trackSystem: SplineTrackSystem) {
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

    // Get valid positions for this car along splines
    if (car.currentTrack) {
      this.dragState.validPositions = this.trackSystem.getValidMovePositions(car.currentTrack, 5);
      console.log(`Found ${this.dragState.validPositions.length} valid spline positions for car ${carId}`);
    } else {
      this.dragState.validPositions = [];
      console.log(`Car ${carId} has no current track`);
    }

    this.dragState.isDragging = true;
    this.dragState.draggedCar = car;
    car.isDragging = true;

    console.log(`Started dragging car ${carId} on spline`);
    return true;
  }

  public updateDrag(mousePosition: Vector2): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const car = this.dragState.draggedCar;
    
    // Calculate target position (mouse position adjusted for drag offset)
    const targetPosition = {
      x: mousePosition.x - this.dragState.dragOffset.x + 17.5, // Add half car width to get center
      y: mousePosition.y - this.dragState.dragOffset.y + 12.5  // Add half car height to get center
    };

    // Find the closest valid position along connected splines
    const result = this.findClosestSplinePosition(targetPosition, car.currentTrack!);
    
    if (result) {
      // Update car position to be centered on the spline point
      car.position = {
        x: result.position.x - 17.5, // Subtract half car width
        y: result.position.y - 12.5  // Subtract half car height
      };
      
      // Update track assignment if changed
      if (result.trackId !== car.currentTrack) {
        // Clear old track
        if (car.currentTrack) {
          this.trackSystem.setTrackOccupied(car.currentTrack, false);
        }
        
        // Check if new track is available
        if (!this.isTrackOccupiedByOtherCar(result.trackId, car.id)) {
          car.currentTrack = result.trackId;
          car.trackProgress = result.t;
          this.trackSystem.setTrackOccupied(result.trackId, true);
        }
      } else {
        // Same track, just update progress
        car.trackProgress = result.t;
      }
    }
  }

  public endDrag(): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const car = this.dragState.draggedCar;
    car.isDragging = false;

    // Snap to final spline position
    if (car.currentTrack) {
      const track = this.trackSystem.getTrack(car.currentTrack);
      if (track) {
        const splinePos = this.trackSystem.getPositionOnSpline(track.spline, car.trackProgress);
        car.position = {
          x: splinePos.x - 17.5,
          y: splinePos.y - 12.5
        };
      }
    }

    console.log(`Ended dragging car ${car.id} on spline`);

    // Reset drag state
    this.dragState.isDragging = false;
    this.dragState.draggedCar = null;
    this.dragState.validPositions = [];
  }

  // Find closest position along any connected spline
  private findClosestSplinePosition(targetPosition: Vector2, currentTrackId: string): { 
    trackId: string; 
    t: number; 
    position: Vector2; 
    distance: number 
  } | null {
    let bestResult: { trackId: string; t: number; position: Vector2; distance: number } | null = null;
    
    // Check current track and connected tracks
    const tracksToCheck = [currentTrackId, ...this.trackSystem.getConnectedTracks(currentTrackId)];
    
    for (const trackId of tracksToCheck) {
      const track = this.trackSystem.getTrack(trackId);
      if (!track) continue;
      
      // Skip if track is occupied by another car (unless it's the current track)
      if (trackId !== currentTrackId && this.isTrackOccupiedByOtherCar(trackId, this.dragState.draggedCar!.id)) {
        continue;
      }
      
      const result = this.trackSystem.findClosestPointOnSpline(track.spline, targetPosition);
      
      if (!bestResult || result.distance < bestResult.distance) {
        bestResult = {
          trackId,
          t: result.t,
          position: result.position,
          distance: result.distance
        };
      }
    }
    
    return bestResult;
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
    console.log(`Checking spline car at position: ${position.x}, ${position.y}`);
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
    
    // Update position based on spline
    const splinePos = this.trackSystem.getPositionOnSpline(targetTrack.spline, car.trackProgress);
    car.position = {
      x: splinePos.x - 17.5,
      y: splinePos.y - 12.5
    };
    
    // Mark new track as occupied
    this.trackSystem.setTrackOccupied(targetTrackId, true);

    return true;
  }

  public getDragState(): DragState {
    return { ...this.dragState };
  }

  public update(deltaTime: number): void {
    // Update car animations, physics, etc.
    for (const car of this.cars.values()) {
      if (!car.isDragging && car.currentTrack) {
        // Ensure car is properly positioned on spline
        const track = this.trackSystem.getTrack(car.currentTrack);
        if (track) {
          const splinePos = this.trackSystem.getPositionOnSpline(track.spline, car.trackProgress);
          const targetPosition = {
            x: splinePos.x - 17.5,
            y: splinePos.y - 12.5
          };
          
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
