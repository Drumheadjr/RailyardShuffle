import { Vector2 } from '@/types';
import { Locomotive, TrainCar, TrainCarType } from '@/types/railyard';
import { SplineTrackSystem } from './SplineTrackSystem';
import { BaseLinkableEntitySystem, LinkableEntity } from './BaseLinkableEntitySystem';
import { TRAIN_CAR, LOCOMOTIVE } from '@/constants/railyard';

export class LocomotiveSystem extends BaseLinkableEntitySystem {
  constructor(trackSystem: SplineTrackSystem) {
    super(trackSystem);
  }

  // Entity-specific behavior implementations
  protected isDraggable(_entity: LinkableEntity): boolean {
    return true; // Locomotives are not draggable
  }

  protected isMovable(_entity: LinkableEntity): boolean {
    return true; // Locomotives are not movable
  }

  protected getEntitySize(entity: LinkableEntity): { width: number; height: number } {
    if (this.isLocomotive(entity)) {
      return { width: entity.size.x, height: entity.size.y };
    } else {
      return { width: TRAIN_CAR.WIDTH, height: TRAIN_CAR.HEIGHT };
    }
  }

  public addLocomotive(locomotive: Locomotive): void {
    this.addEntity(locomotive);
    console.log(`Added locomotive ${locomotive.id} at track ${locomotive.currentTrack}`);
  }

  public getLocomotive(id: string): Locomotive | undefined {
    const entity = this.getEntity(id);
    return entity && this.isLocomotive(entity) ? entity : undefined;
  }

  public getAllLocomotives(): Locomotive[] {
    return this.getAllEntities().filter(this.isLocomotive);
  }

  public getActiveLocomotives(): Locomotive[] {
    return this.getAllLocomotives().filter(loco => loco.isActive);
  }

  // Check if a car can link to a locomotive (using same system as car-to-car linking)
  public canCarLinkToLocomotive(car: TrainCar, locomotive: Locomotive): boolean {
    // Check if locomotive accepts this car type
    if (!locomotive.acceptedCarTypes.includes(car.type)) {
      console.log(`Locomotive ${locomotive.id} doesn't accept car type ${car.type}`);
      return false;
    }

    // Check if locomotive has space (count linked cars)
    const linkedCarCount = this.getLinkedCarCount(locomotive);
    if (linkedCarCount >= locomotive.maxCars) {
      console.log(`Locomotive ${locomotive.id} is at capacity (${locomotive.maxCars} cars, currently has ${linkedCarCount})`);
      return false;
    }

    // Check if locomotive is active
    if (!locomotive.isActive) {
      console.log(`Locomotive ${locomotive.id} is not active`);
      return false;
    }

    // Check if car is close enough to locomotive (using same distance as car linking)
    const distance = this.calculateDistance(car.position, locomotive.position);

    if (distance > 50) { // Same as TRAIN_CAR.LINKING_DISTANCE
      console.log(`Car ${car.id} too far from locomotive ${locomotive.id} (distance: ${distance})`);
      return false;
    }

    // Check if already linked
    if (locomotive.linkedCars.includes(car.id) || car.linkedCars.includes(locomotive.id)) {
      console.log(`Car ${car.id} already linked to locomotive ${locomotive.id}`);
      return false;
    }

    return true;
  }

  // Count how many cars are linked to this locomotive
  private getLinkedCarCount(locomotive: Locomotive): number {
    return locomotive.linkedCars.length;
  }

  // Link a car to a locomotive (wrapper for base class method)
  public linkCarToLocomotive(car: TrainCar, locomotive: Locomotive): boolean {
    return this.linkEntities(car, locomotive);
  }

  // Unlink a car from a locomotive (wrapper for base class method)
  public unlinkCarFromLocomotive(car: TrainCar, locomotive: Locomotive): boolean {
    // TODO: Implement unlinking in base class if needed
    console.log(`Unlinking not yet implemented in base class for ${car.id} and ${locomotive.id}`);
    return false;
  }

  // Check if a car is near any active locomotive
  public findNearbyLocomotive(car: TrainCar): Locomotive | null {
    for (const locomotive of this.getActiveLocomotives()) {
      // Use base class distance calculation and linking validation
      const distance = this.getPixelDistanceBetweenEntities(car, locomotive);
      if (distance <= TRAIN_CAR.LINKING_DISTANCE && this.canCarLinkToLocomotive(car, locomotive)) {
        return locomotive;
      }
    }
    return null;
  }

  // Update locomotive positions and connections
  public update(deltaTime: number): void {
    // Call base class update first
    super.update(deltaTime);

    for (const locomotive of this.getAllLocomotives()) {
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

  // Check if all required cars are linked to locomotives
  public checkLevelCompletion(requiredConnections: { carId: string; locomotiveId: string }[]): boolean {
    console.log(`Checking level completion for ${requiredConnections.length} required connections:`);

    for (const requirement of requiredConnections) {
      console.log(`  Checking: car ${requirement.carId} -> locomotive ${requirement.locomotiveId}`);

      const locomotive = this.getLocomotive(requirement.locomotiveId);
      if (!locomotive) {
        console.log(`    ❌ Locomotive ${requirement.locomotiveId} not found`);
        return false;
      }

      console.log(`    Locomotive ${locomotive.id} has linked cars: [${locomotive.linkedCars.join(', ')}]`);

      if (!locomotive.linkedCars.includes(requirement.carId)) {
        console.log(`    ❌ Car ${requirement.carId} not linked to locomotive ${requirement.locomotiveId}`);
        return false;
      }

      console.log(`    ✅ Car ${requirement.carId} is linked to locomotive ${requirement.locomotiveId}`);
    }

    console.log(`🎉 Level completion check passed! All cars are linked.`);
    return true;
  }

  // Get locomotive at position (for clicking/interaction)
  public getLocomotiveAtPosition(position: Vector2): Locomotive | null {
    for (const locomotive of this.getAllLocomotives()) {
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
    this.removeEntity(locomotiveId);
  }

  // getDragState() is now inherited from BaseLinkableEntitySystem

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
      size: { x: LOCOMOTIVE.WIDTH, y: LOCOMOTIVE.HEIGHT }, // Use constants for consistent sizing
      currentTrack: trackId,
      trackProgress: progress,
      color,
      isDragging: false,
      isCompleted: false,
      linkedCars: [],
      acceptedCarTypes: [TrainCarType.REGULAR, TrainCarType.CARGO, TrainCarType.PASSENGER],
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
      size: { x: LOCOMOTIVE.WIDTH, y: LOCOMOTIVE.HEIGHT }, // Use constants for consistent sizing
      currentTrack: trackId,
      trackProgress: progress,
      color,
      isDragging: false,
      isCompleted: false,
      linkedCars: [],
      acceptedCarTypes: acceptedTypes,
      maxCars,
      isActive: true
    };
  }
}
