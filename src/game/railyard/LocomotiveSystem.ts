import { Vector2 } from '@/types';
import { Locomotive, TrainCar, TrainCarType } from '@/types/railyard';
import { SplineTrackSystem } from './SplineTrackSystem';

export class LocomotiveSystem {
  private locomotives: Map<string, Locomotive> = new Map();
  private trackSystem: SplineTrackSystem;

  constructor(trackSystem: SplineTrackSystem) {
    this.trackSystem = trackSystem;
  }

  public addLocomotive(locomotive: Locomotive): void {
    this.locomotives.set(locomotive.id, locomotive);
    
    // Mark track as occupied
    if (locomotive.currentTrack) {
      this.trackSystem.setTrackOccupied(locomotive.currentTrack, true);
    }
    
    console.log(`Added locomotive ${locomotive.id} at track ${locomotive.currentTrack}`);
  }

  public getLocomotive(id: string): Locomotive | undefined {
    return this.locomotives.get(id);
  }

  public getAllLocomotives(): Locomotive[] {
    return Array.from(this.locomotives.values());
  }

  public getActiveLocomotives(): Locomotive[] {
    return this.getAllLocomotives().filter(loco => loco.isActive);
  }

  // Check if a car can connect to a locomotive
  public canCarConnectToLocomotive(car: TrainCar, locomotive: Locomotive): boolean {
    // Check if locomotive accepts this car type
    if (!locomotive.acceptedCarTypes.includes(car.type)) {
      console.log(`Locomotive ${locomotive.id} doesn't accept car type ${car.type}`);
      return false;
    }

    // Check if locomotive has space
    if (locomotive.connectedCars.length >= locomotive.maxCars) {
      console.log(`Locomotive ${locomotive.id} is at capacity (${locomotive.maxCars} cars)`);
      return false;
    }

    // Check if locomotive is active
    if (!locomotive.isActive) {
      console.log(`Locomotive ${locomotive.id} is not active`);
      return false;
    }

    // Check if car is close enough to locomotive
    const distance = this.calculateDistance(car.position, locomotive.position);
    const connectionDistance = 50; // Pixels
    
    if (distance > connectionDistance) {
      console.log(`Car ${car.id} too far from locomotive ${locomotive.id} (distance: ${distance})`);
      return false;
    }

    return true;
  }

  // Connect a car to a locomotive
  public connectCarToLocomotive(car: TrainCar, locomotive: Locomotive): boolean {
    if (!this.canCarConnectToLocomotive(car, locomotive)) {
      return false;
    }

    // Add car to locomotive's connected cars
    locomotive.connectedCars.push(car.id);
    
    // Mark car as completed
    car.isCompleted = true;
    car.targetLocomotive = locomotive.id;

    // Position car near locomotive (for visual feedback)
    const offset = locomotive.connectedCars.length * 40; // Space cars out
    const locomotiveTrack = this.trackSystem.getTrack(locomotive.currentTrack!);
    if (locomotiveTrack) {
      // Position car slightly behind locomotive on the same track
      const newProgress = Math.max(0, locomotive.trackProgress - (offset / 600)); // Approximate track length
      const splinePos = this.trackSystem.getPositionOnSpline(locomotiveTrack.spline, newProgress);
      car.position = {
        x: splinePos.x - 17.5,
        y: splinePos.y - 12.5
      };
      car.currentTrack = locomotive.currentTrack;
      car.trackProgress = newProgress;
    }

    console.log(`Connected car ${car.id} to locomotive ${locomotive.id}`);
    return true;
  }

  // Disconnect a car from a locomotive
  public disconnectCarFromLocomotive(carId: string, locomotiveId: string): boolean {
    const locomotive = this.locomotives.get(locomotiveId);
    if (!locomotive) return false;

    const carIndex = locomotive.connectedCars.indexOf(carId);
    if (carIndex === -1) return false;

    locomotive.connectedCars.splice(carIndex, 1);
    console.log(`Disconnected car ${carId} from locomotive ${locomotiveId}`);
    return true;
  }

  // Check if a car is near any active locomotive
  public findNearbyLocomotive(car: TrainCar): Locomotive | null {
    for (const locomotive of this.getActiveLocomotives()) {
      if (this.canCarConnectToLocomotive(car, locomotive)) {
        return locomotive;
      }
    }
    return null;
  }

  // Update locomotive positions and connections
  public update(deltaTime: number): void {
    for (const locomotive of this.locomotives.values()) {
      if (!locomotive.isDragging && locomotive.currentTrack) {
        // Ensure locomotive is properly positioned on spline
        const track = this.trackSystem.getTrack(locomotive.currentTrack);
        if (track) {
          const splinePos = this.trackSystem.getPositionOnSpline(track.spline, locomotive.trackProgress);
          const targetPosition = {
            x: splinePos.x - 17.5,
            y: splinePos.y - 12.5
          };
          
          // Smooth movement to correct position
          const lerpFactor = Math.min(1, deltaTime * 0.01);
          locomotive.position.x += (targetPosition.x - locomotive.position.x) * lerpFactor;
          locomotive.position.y += (targetPosition.y - locomotive.position.y) * lerpFactor;
        }
      }
    }
  }

  // Check if all required cars are connected to locomotives
  public checkLevelCompletion(requiredConnections: { carId: string; locomotiveId: string }[]): boolean {
    for (const requirement of requiredConnections) {
      const locomotive = this.locomotives.get(requirement.locomotiveId);
      if (!locomotive || !locomotive.connectedCars.includes(requirement.carId)) {
        return false;
      }
    }
    return true;
  }

  // Get locomotive at position (for clicking/interaction)
  public getLocomotiveAtPosition(position: Vector2): Locomotive | null {
    for (const locomotive of this.locomotives.values()) {
      if (this.isPositionOnLocomotive(position, locomotive)) {
        return locomotive;
      }
    }
    return null;
  }

  private isPositionOnLocomotive(position: Vector2, locomotive: Locomotive): boolean {
    return position.x >= locomotive.position.x &&
           position.x <= locomotive.position.x + locomotive.size.x &&
           position.y >= locomotive.position.y &&
           position.y <= locomotive.position.y + locomotive.size.y;
  }

  private calculateDistance(pos1: Vector2, pos2: Vector2): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  // Remove locomotive
  public removeLocomotive(locomotiveId: string): void {
    const locomotive = this.locomotives.get(locomotiveId);
    if (locomotive) {
      // Clear track occupation
      if (locomotive.currentTrack) {
        this.trackSystem.setTrackOccupied(locomotive.currentTrack, false);
      }
      
      this.locomotives.delete(locomotiveId);
    }
  }

  // Create a standard locomotive
  public static createStandardLocomotive(
    id: string, 
    trackId: string, 
    progress: number, 
    color: string = '#2C3E50'
  ): Locomotive {
    return {
      id,
      type: TrainCarType.LOCOMOTIVE,
      position: { x: 0, y: 0 }, // Will be calculated from track position
      size: { x: 45, y: 30 }, // Slightly larger than regular cars
      currentTrack: trackId,
      trackProgress: progress,
      color,
      isDragging: false,
      isCompleted: false,
      acceptedCarTypes: [TrainCarType.REGULAR, TrainCarType.CARGO, TrainCarType.PASSENGER],
      connectedCars: [],
      maxCars: 5,
      isActive: true
    };
  }

  // Create a specialized locomotive
  public static createSpecializedLocomotive(
    id: string,
    trackId: string,
    progress: number,
    acceptedTypes: TrainCarType[],
    maxCars: number = 3,
    color: string = '#8E44AD'
  ): Locomotive {
    return {
      id,
      type: TrainCarType.LOCOMOTIVE,
      position: { x: 0, y: 0 },
      size: { x: 45, y: 30 },
      currentTrack: trackId,
      trackProgress: progress,
      color,
      isDragging: false,
      isCompleted: false,
      acceptedCarTypes: acceptedTypes,
      connectedCars: [],
      maxCars,
      isActive: true
    };
  }
}
