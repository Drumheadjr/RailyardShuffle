import { Vector2 } from '@/types';
import { TrainCar, DragState } from '@/types/railyard';
import { SplineTrackSystem } from './SplineTrackSystem';
import { TRAIN_CAR } from '@/constants/railyard';

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

  // Convert pixel distance to spline progress difference
  private pixelDistanceToProgressDelta(pixelDistance: number, trackId: string): number {
    const track = this.trackSystem.getTrack(trackId);
    if (!track) return 0;

    // Sample the spline to estimate total length
    const samples = 100;
    let totalLength = 0;

    for (let i = 0; i < samples; i++) {
      const t1 = i / samples;
      const t2 = (i + 1) / samples;
      const pos1 = this.trackSystem.getPositionOnSpline(track.spline, t1);
      const pos2 = this.trackSystem.getPositionOnSpline(track.spline, t2);

      const segmentLength = Math.sqrt(
        Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
      );
      totalLength += segmentLength;
    }

    // Convert pixel distance to progress delta
    return pixelDistance / totalLength;
  }

  // Get pixel distance between two cars on the same track
  private getPixelDistanceBetweenCars(car1: TrainCar, car2: TrainCar): number {
    if (car1.currentTrack !== car2.currentTrack) return Infinity;

    const track = this.trackSystem.getTrack(car1.currentTrack!);
    if (!track) return Infinity;

    const pos1 = this.trackSystem.getPositionOnSpline(track.spline, car1.trackProgress);
    const pos2 = this.trackSystem.getPositionOnSpline(track.spline, car2.trackProgress);

    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  // Link two cars together
  public linkCars(car1: TrainCar, car2: TrainCar): void {
    if (car1.linkedCars.includes(car2.id) || car2.linkedCars.includes(car1.id)) {
      console.log(`Cars ${car1.id} and ${car2.id} are already linked`);
      return; // Already linked
    }

    // Determine which car is in front based on track progress
    const frontCar = car1.trackProgress > car2.trackProgress ? car1 : car2;
    const backCar = car1.trackProgress > car2.trackProgress ? car2 : car1;

    // Link the cars
    frontCar.linkedToBack = backCar.id;
    backCar.linkedToFront = frontCar.id;

    // Add to linked cars arrays
    frontCar.linkedCars.push(backCar.id);
    backCar.linkedCars.push(frontCar.id);

    // Position the back car at the correct fixed distance from the front car
    this.positionLinkedCarAtFixedDistance(frontCar, backCar);

    console.log(`Successfully linked cars: ${frontCar.id} (front, progress: ${frontCar.trackProgress}) <-> ${backCar.id} (back, progress: ${backCar.trackProgress})`);
    console.log(`Car ${frontCar.id} now has ${frontCar.linkedCars.length} linked cars: [${frontCar.linkedCars.join(', ')}]`);
    console.log(`Car ${backCar.id} now has ${backCar.linkedCars.length} linked cars: [${backCar.linkedCars.join(', ')}]`);
  }

  // Position a linked car at a fixed pixel distance from another car
  private positionLinkedCarAtFixedDistance(frontCar: TrainCar, backCar: TrainCar): void {
    if (!frontCar.currentTrack || frontCar.currentTrack !== backCar.currentTrack) return;

    const track = this.trackSystem.getTrack(frontCar.currentTrack);
    if (!track) return;

    // Find the position that is exactly LINKED_CAR_SPACING pixels behind the front car
    const targetDistance = TRAIN_CAR.LINKED_CAR_SPACING;
    let bestProgress = backCar.trackProgress;
    let bestDistance = Infinity;

    // Sample positions along the track to find the one closest to our target distance
    const samples = 200;
    for (let i = 0; i < samples; i++) {
      const testProgress = i / samples;
      if (testProgress >= frontCar.trackProgress) continue; // Only check positions behind the front car

      const tempCar: TrainCar = { ...backCar, trackProgress: testProgress };
      const distance = this.getPixelDistanceBetweenCars(frontCar, tempCar);

      if (Math.abs(distance - targetDistance) < Math.abs(bestDistance - targetDistance)) {
        bestDistance = distance;
        bestProgress = testProgress;
      }
    }

    // Update the back car's position
    backCar.trackProgress = bestProgress;
    const splinePos = this.trackSystem.getPositionOnSpline(track.spline, bestProgress);
    backCar.position = {
      x: splinePos.x - 17.5,
      y: splinePos.y - 12.5
    };

    console.log(`Positioned linked car ${backCar.id} at ${targetDistance}px distance (actual: ${bestDistance}px)`);
  }

  // Unlink two cars
  public unlinkCars(car1: TrainCar, car2: TrainCar): void {
    // Remove from linked cars arrays
    car1.linkedCars = car1.linkedCars.filter(id => id !== car2.id);
    car2.linkedCars = car2.linkedCars.filter(id => id !== car1.id);

    // Clear direct link references
    if (car1.linkedToFront === car2.id) car1.linkedToFront = undefined;
    if (car1.linkedToBack === car2.id) car1.linkedToBack = undefined;
    if (car2.linkedToFront === car1.id) car2.linkedToFront = undefined;
    if (car2.linkedToBack === car1.id) car2.linkedToBack = undefined;

    console.log(`Unlinked cars: ${car1.id} and ${car2.id}`);
  }

  // Check for collisions but exclude linked cars from collision detection
  private checkCollisionsForLinkedTrain(movingCar: TrainCar, targetProgress: number): { canMove: boolean; adjustedProgress: number; linkedCar?: TrainCar } {
    if (!movingCar.currentTrack) {
      return { canMove: true, adjustedProgress: targetProgress };
    }

    // Get all linked cars to exclude them from collision detection
    const linkedCarIds = this.getAllLinkedCarIds(movingCar);

    const carsOnSameTrack = Array.from(this.cars.values()).filter(car =>
      car.currentTrack === movingCar.currentTrack &&
      car.id !== movingCar.id &&
      !linkedCarIds.has(car.id) // Exclude linked cars
    );

    // Create a temporary car at target position to check distances
    const tempCar: TrainCar = { ...movingCar, trackProgress: targetProgress };

    for (const otherCar of carsOnSameTrack) {
      const pixelDistance = this.getPixelDistanceBetweenCars(tempCar, otherCar);

      // Check if cars are close enough to link (using fixed pixel distance)
      if (pixelDistance <= TRAIN_CAR.LINKING_DISTANCE && !movingCar.linkedCars.includes(otherCar.id)) {
        console.log(`Cars ${movingCar.id} and ${otherCar.id} are close enough to link (pixel distance: ${pixelDistance})`);
        return {
          canMove: true,
          adjustedProgress: targetProgress,
          linkedCar: otherCar
        };
      }

      // Check for collision (too close but not linking) - use minimum spacing
      const minPixelSeparation = TRAIN_CAR.WIDTH + 10; // Car width plus small buffer
      if (pixelDistance < minPixelSeparation) {
        // Calculate adjusted position to maintain minimum separation
        const track = this.trackSystem.getTrack(movingCar.currentTrack!);
        if (track) {
          // Find a position that maintains the minimum separation
          const progressDelta = this.pixelDistanceToProgressDelta(minPixelSeparation, movingCar.currentTrack!);
          const pushDirection = targetProgress > otherCar.trackProgress ? 1 : -1;
          const adjustedProgress = otherCar.trackProgress + (pushDirection * progressDelta);

          console.log(`Collision detected between ${movingCar.id} and ${otherCar.id}, adjusting position (pixel distance: ${pixelDistance})`);
          return {
            canMove: true,
            adjustedProgress: Math.max(0, Math.min(1, adjustedProgress))
          };
        }
      }
    }

    return { canMove: true, adjustedProgress: targetProgress };
  }

  // Get all cars linked to this car (including indirectly linked)
  private getAllLinkedCarIds(car: TrainCar): Set<string> {
    const linkedIds = new Set<string>();
    const queue = [car.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentCarId = queue.shift()!;
      if (visited.has(currentCarId)) continue;
      visited.add(currentCarId);

      const currentCar = this.cars.get(currentCarId);
      if (!currentCar) continue;

      // Add this car to linked set (except the original car)
      if (currentCarId !== car.id) {
        linkedIds.add(currentCarId);
      }

      // Add linked cars to queue
      for (const linkedCarId of currentCar.linkedCars) {
        if (!visited.has(linkedCarId)) {
          queue.push(linkedCarId);
        }
      }
    }

    return linkedIds;
  }

  // Move all linked cars maintaining fixed spacing
  private moveLinkedCarsRelative(draggedCar: TrainCar, deltaProgress: number): void {
    console.log(`Moving linked cars for ${draggedCar.id} with delta ${deltaProgress}`);

    // Get all linked cars in order (front to back)
    const linkedCars = this.getLinkedCarsInOrder(draggedCar);

    // Update positions maintaining fixed spacing
    for (let i = 0; i < linkedCars.length; i++) {
      const car = linkedCars[i];
      if (car.id === draggedCar.id) continue; // Skip the dragged car

      // Find the car in front of this one
      const frontCar = i > 0 ? linkedCars[i - 1] : null;
      if (frontCar) {
        // Position this car at fixed distance behind the front car
        this.positionLinkedCarAtFixedDistance(frontCar, car);
      } else {
        // This shouldn't happen in a well-formed chain, but handle it gracefully
        const newProgress = Math.max(0, Math.min(1, car.trackProgress + deltaProgress));
        car.trackProgress = newProgress;

        if (car.currentTrack) {
          const track = this.trackSystem.getTrack(car.currentTrack);
          if (track) {
            const splinePos = this.trackSystem.getPositionOnSpline(track.spline, newProgress);
            car.position = {
              x: splinePos.x - 17.5,
              y: splinePos.y - 12.5
            };
          }
        }
      }
    }

    console.log(`Updated positions for ${linkedCars.length - 1} linked cars maintaining fixed spacing`);
  }

  // Get all linked cars in order from front to back
  private getLinkedCarsInOrder(startCar: TrainCar): TrainCar[] {
    const visited = new Set<string>();
    const cars: TrainCar[] = [];

    // Find the front-most car
    let frontCar = startCar;
    while (frontCar.linkedToFront) {
      const nextCar = this.cars.get(frontCar.linkedToFront);
      if (!nextCar || visited.has(nextCar.id)) break;
      frontCar = nextCar;
      visited.add(nextCar.id);
    }

    // Build the chain from front to back
    visited.clear();
    let currentCar: TrainCar | undefined = frontCar;

    while (currentCar && !visited.has(currentCar.id)) {
      visited.add(currentCar.id);
      cars.push(currentCar);

      // Move to the next car in the chain
      const nextCarId: string | undefined = currentCar.linkedToBack;
      currentCar = nextCarId ? this.cars.get(nextCarId) : undefined;
    }

    return cars;
  }

  public getCar(id: string): TrainCar | undefined {
    return this.cars.get(id);
  }

  public getAllCars(): TrainCar[] {
    return Array.from(this.cars.values());
  }

  public startDrag(carId: string, mousePosition: Vector2): boolean {
    const car = this.cars.get(carId);
    if (!car || car.isCompleted) return false;

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

    // Mark all linked cars as being dragged (for visual feedback)
    console.log(`Car ${carId} has ${car.linkedCars.length} linked cars: [${car.linkedCars.join(', ')}]`);
    this.setLinkedCarsDragging(car, true);

    console.log(`Started dragging car ${carId} and its linked cars on spline`);
    return true;
  }

  // Set dragging state for all linked cars
  private setLinkedCarsDragging(car: TrainCar, isDragging: boolean): void {
    const visited = new Set<string>();
    const queue = [car.id];

    while (queue.length > 0) {
      const currentCarId = queue.shift()!;
      if (visited.has(currentCarId)) continue;
      visited.add(currentCarId);

      const currentCar = this.cars.get(currentCarId);
      if (!currentCar) continue;

      // Set dragging state (but only the main car is the "draggedCar")
      if (currentCarId !== car.id) {
        currentCar.isDragging = isDragging;
      }

      // Add linked cars to queue
      for (const linkedCarId of currentCar.linkedCars) {
        if (!visited.has(linkedCarId)) {
          queue.push(linkedCarId);
        }
      }
    }
  }

  public updateDrag(mousePosition: Vector2): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const car = this.dragState.draggedCar;
    const oldProgress = car.trackProgress;

    // Calculate target position (mouse position adjusted for drag offset)
    const targetPosition = {
      x: mousePosition.x - this.dragState.dragOffset.x + 17.5, // Add half car width to get center
      y: mousePosition.y - this.dragState.dragOffset.y + 12.5  // Add half car height to get center
    };

    // Find the closest valid position along connected splines
    const result = this.findClosestSplinePosition(targetPosition, car.currentTrack!);

    if (result) {
      // Check for collisions and linking opportunities (but exclude linked cars from collision)
      const collisionResult = this.checkCollisionsForLinkedTrain(car, result.t);

      // Handle linking if a car is close enough
      if (collisionResult.linkedCar) {
        this.linkCars(car, collisionResult.linkedCar);
      }

      // Use adjusted progress from collision detection
      const finalProgress = collisionResult.adjustedProgress;
      const deltaProgress = finalProgress - oldProgress;

      console.log(`Dragging car ${car.id}: oldProgress=${oldProgress}, finalProgress=${finalProgress}, delta=${deltaProgress}`);

      // Update the dragged car position and progress FIRST
      car.trackProgress = finalProgress;
      const track = this.trackSystem.getTrack(result.trackId);
      if (track) {
        const splinePos = this.trackSystem.getPositionOnSpline(track.spline, finalProgress);
        car.position = {
          x: splinePos.x - 17.5, // Subtract half car width
          y: splinePos.y - 12.5  // Subtract half car height
        };
      }

      // Move all linked cars together if there's actual movement
      if (Math.abs(deltaProgress) > 0.001) { // Only move if there's significant change
        this.moveLinkedCarsRelative(car, deltaProgress);
      }

      // Update track assignment if changed
      if (result.trackId !== car.currentTrack) {
        // Clear old track
        if (car.currentTrack) {
          this.trackSystem.setTrackOccupied(car.currentTrack, false);
        }

        // Check if new track is available
        if (!this.isTrackOccupiedByOtherCar(result.trackId, car.id)) {
          car.currentTrack = result.trackId;
          this.trackSystem.setTrackOccupied(result.trackId, true);
        }
      }
    }
  }

  public endDrag(): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const car = this.dragState.draggedCar;
    car.isDragging = false;

    // Clear dragging state for all linked cars
    this.setLinkedCarsDragging(car, false);

    // Snap to final spline position for the main car
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

    // Snap all linked cars to their final positions
    this.snapLinkedCarsToSpline(car);

    console.log(`Ended dragging car ${car.id} and its linked cars on spline`);

    // Reset drag state
    this.dragState.isDragging = false;
    this.dragState.draggedCar = null;
    this.dragState.validPositions = [];
  }

  // Snap all linked cars to their correct spline positions
  private snapLinkedCarsToSpline(car: TrainCar): void {
    const visited = new Set<string>();
    const queue = [car.id];

    while (queue.length > 0) {
      const currentCarId = queue.shift()!;
      if (visited.has(currentCarId)) continue;
      visited.add(currentCarId);

      const currentCar = this.cars.get(currentCarId);
      if (!currentCar || currentCarId === car.id) continue; // Skip the main car

      // Snap to spline position
      if (currentCar.currentTrack) {
        const track = this.trackSystem.getTrack(currentCar.currentTrack);
        if (track) {
          const splinePos = this.trackSystem.getPositionOnSpline(track.spline, currentCar.trackProgress);
          currentCar.position = {
            x: splinePos.x - 17.5,
            y: splinePos.y - 12.5
          };
        }
      }

      // Add linked cars to queue
      for (const linkedCarId of currentCar.linkedCars) {
        if (!visited.has(linkedCarId)) {
          queue.push(linkedCarId);
        }
      }
    }
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
