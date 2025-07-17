import { Vector2 } from "@/types";
import {
  TrainCar,
  Locomotive,
  DragState,
  TrainCarType,
} from "@/types/railyard";
import { SplineTrackSystem } from "./SplineTrackSystem";
import { TRAIN_CAR } from "@/constants/railyard";

// Union type for all entities
export type Entity = TrainCar | Locomotive;

export class EntitySystem {
  private entities: Map<string, Entity> = new Map();
  private trackSystem: SplineTrackSystem;
  private dragState: DragState;

  constructor(trackSystem: SplineTrackSystem) {
    this.trackSystem = trackSystem;
    this.dragState = {
      isDragging: false,
      draggedCar: null,
      dragOffset: { x: 0, y: 0 },
      validPositions: [],
    };
  }

  // Entity management
  public addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);

    // If entity is on a track, mark it as occupied
    if (entity.currentTrack) {
      this.trackSystem.setTrackOccupied(entity.currentTrack, true);
    }
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      // Clear track occupation
      if (entity.currentTrack) {
        this.trackSystem.setTrackOccupied(entity.currentTrack, false);
      }

      this.entities.delete(entityId);
    }
  }

  // Type guards
  public isTrainCar(entity: Entity): entity is TrainCar {
    return entity.type !== TrainCarType.LOCOMOTIVE;
  }

  public isLocomotive(entity: Entity): entity is Locomotive {
    return entity.type === TrainCarType.LOCOMOTIVE;
  }

  // Entity behavior checks
  public isDraggable(entity: Entity): boolean {
    if (this.isLocomotive(entity)) {
      return true; // Locomotives are draggable
    } else {
      return !entity.isCompleted; // Train cars are draggable unless completed
    }
  }

  public isMovable(_entity: Entity): boolean {
    return true; // All entities are movable
  }

  public getEntitySize(entity: Entity): { width: number; height: number } {
    if (this.isLocomotive(entity)) {
      return { width: entity.size.x, height: entity.size.y };
    } else {
      return { width: TRAIN_CAR.WIDTH, height: TRAIN_CAR.HEIGHT };
    }
  }

  // Convenience methods for backward compatibility
  public addCar(car: TrainCar): void {
    this.addEntity(car);
  }

  public addLocomotive(locomotive: Locomotive): void {
    this.addEntity(locomotive);
  }

  public getCar(id: string): TrainCar | undefined {
    const entity = this.getEntity(id);
    return entity && this.isTrainCar(entity) ? entity : undefined;
  }

  public getLocomotive(id: string): Locomotive | undefined {
    const entity = this.getEntity(id);
    return entity && this.isLocomotive(entity) ? entity : undefined;
  }

  public getAllCars(): TrainCar[] {
    return this.getAllEntities().filter(this.isTrainCar);
  }

  public getAllLocomotives(): Locomotive[] {
    return this.getAllEntities().filter(this.isLocomotive);
  }

  // Get entity at position
  public getEntityAtPosition(position: Vector2): Entity | null {
    console.log(`Checking entity at position: ${position.x}, ${position.y}`);
    for (const entity of this.entities.values()) {
      const entitySize = this.getEntitySize(entity);
      console.log(
        `Entity ${entity.id} at: ${entity.position.x}, ${entity.position.y}, size: ${entitySize.width}x${entitySize.height}`
      );
      if (this.isPositionOnEntity(position, entity)) {
        console.log(`Found entity ${entity.id} at position`);
        return entity;
      }
    }
    return null;
  }

  private isPositionOnEntity(position: Vector2, entity: Entity): boolean {
    const entitySize = this.getEntitySize(entity);
    return (
      position.x >= entity.position.x &&
      position.x <= entity.position.x + entitySize.width &&
      position.y >= entity.position.y &&
      position.y <= entity.position.y + entitySize.height
    );
  }

  // Get car at position (for backward compatibility)
  public getCarAtPosition(position: Vector2): TrainCar | null {
    const entity = this.getEntityAtPosition(position);
    return entity && this.isTrainCar(entity) ? entity : null;
  }

  // Get drag state
  public getDragState(): DragState {
    return this.dragState;
  }

  // Update method
  public update(_deltaTime: number): void {
    // Update all entities
    for (const entity of this.entities.values()) {
      // Update entity positions based on track progress
      if (entity.currentTrack) {
        const track = this.trackSystem.getTrack(entity.currentTrack);
        if (track) {
          const splinePos = this.trackSystem.getPositionOnSpline(
            track.spline,
            entity.trackProgress
          );
          const entitySize = this.getEntitySize(entity);
          entity.position = {
            x: splinePos.x - entitySize.width / 2,
            y: splinePos.y - entitySize.height / 2,
          };
        }
      }
    }
  }

  // DRAG OPERATIONS
  public startDrag(entityId: string, mousePosition: Vector2): boolean {
    const entity = this.entities.get(entityId);
    if (!entity || !this.isDraggable(entity)) return false;

    // Calculate drag offset (where on the entity the mouse clicked)
    this.dragState.dragOffset = {
      x: mousePosition.x - entity.position.x,
      y: mousePosition.y - entity.position.y,
    };

    this.dragState.isDragging = true;
    this.dragState.draggedCar = entity as TrainCar; // TODO: Make this more generic
    entity.isDragging = true;

    // Mark all linked entities as being dragged (for visual feedback)
    console.log(
      `Entity ${entityId} has ${
        entity.linkedCars.length
      } linked entities: [${entity.linkedCars.join(", ")}]`
    );
    this.setLinkedEntitiesDragging(entity, true);

    console.log(`Started dragging entity ${entityId} and its linked entities`);
    return true;
  }

  public updateDrag(mousePosition: Vector2): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const entity = this.dragState.draggedCar;
    const oldProgress = entity.trackProgress;

    // Calculate target position (mouse position adjusted for drag offset)
    const entitySize = this.getEntitySize(entity);
    const targetPosition = {
      x: mousePosition.x - this.dragState.dragOffset.x + entitySize.width / 2,
      y: mousePosition.y - this.dragState.dragOffset.y + entitySize.height / 2,
    };

    // Find the closest valid position along connected splines
    const result = this.findClosestSplinePosition(
      targetPosition,
      entity.currentTrack!
    );

    if (result) {
      // Check for collisions and linking opportunities
      const collisionResult = this.checkCollisionsForLinkedEntity(
        entity,
        result.t
      );

      // Handle linking if entities are close enough
      if (collisionResult.linkedEntity) {
        this.linkEntities(entity, collisionResult.linkedEntity);
      }

      // Use adjusted progress from collision detection
      const finalProgress = collisionResult.adjustedProgress;
      const deltaProgress = finalProgress - oldProgress;

      console.log(
        `Dragging entity ${entity.id}: oldProgress=${oldProgress}, finalProgress=${finalProgress}, delta=${deltaProgress}`
      );

      // Update the dragged entity position and progress FIRST
      entity.trackProgress = finalProgress;
      const track = this.trackSystem.getTrack(result.trackId);
      if (track) {
        const splinePos = this.trackSystem.getPositionOnSpline(
          track.spline,
          finalProgress
        );
        const entitySize = this.getEntitySize(entity);
        entity.position = {
          x: splinePos.x - entitySize.width / 2,
          y: splinePos.y - entitySize.height / 2,
        };
      }

      // Move all linked entities together if there's actual movement
      if (Math.abs(deltaProgress) > 0.001) {
        this.moveLinkedEntitiesRelative(entity, deltaProgress);
      }

      // Update track assignment if changed
      if (result.trackId !== entity.currentTrack) {
        // Clear old track
        if (entity.currentTrack) {
          this.trackSystem.setTrackOccupied(entity.currentTrack, false);
        }

        // Check if new track is available
        if (!this.isTrackOccupiedByOtherEntity(result.trackId, entity.id)) {
          entity.currentTrack = result.trackId;
          this.trackSystem.setTrackOccupied(result.trackId, true);
        }
      }
    }
  }

  public endDrag(): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCar) return;

    const entity = this.dragState.draggedCar;

    // Clear dragging state for all linked entities
    this.setLinkedEntitiesDragging(entity, false);

    entity.isDragging = false;
    this.dragState.isDragging = false;
    this.dragState.draggedCar = null;
    this.dragState.dragOffset = { x: 0, y: 0 };

    console.log(`Ended dragging entity ${entity.id}`);
  }

  // HELPER METHODS FOR DRAG OPERATIONS
  private setLinkedEntitiesDragging(entity: Entity, isDragging: boolean): void {
    const visited = new Set<string>();
    const queue = [entity.id];

    while (queue.length > 0) {
      const currentEntityId = queue.shift()!;
      if (visited.has(currentEntityId)) continue;
      visited.add(currentEntityId);

      const currentEntity = this.entities.get(currentEntityId);
      if (!currentEntity) continue;

      // Set dragging state (but only the main entity is the "draggedCar")
      if (currentEntityId !== entity.id) {
        currentEntity.isDragging = isDragging;
      }

      // Add linked entities to queue
      for (const linkedEntityId of currentEntity.linkedCars) {
        if (!visited.has(linkedEntityId)) {
          queue.push(linkedEntityId);
        }
      }
    }
  }

  private findClosestSplinePosition(
    targetPosition: Vector2,
    currentTrackId: string
  ): {
    trackId: string;
    t: number;
    position: Vector2;
    distance: number;
  } | null {
    let bestResult: {
      trackId: string;
      t: number;
      position: Vector2;
      distance: number;
    } | null = null;

    // Check current track and connected tracks
    const tracksToCheck = [
      currentTrackId,
      ...this.trackSystem.getConnectedTracks(currentTrackId),
    ];

    for (const trackId of tracksToCheck) {
      const track = this.trackSystem.getTrack(trackId);
      if (!track) continue;

      // Skip if track is occupied by another entity (unless it's the current track)
      if (
        trackId !== currentTrackId &&
        this.isTrackOccupiedByOtherEntity(
          trackId,
          this.dragState.draggedCar!.id
        )
      ) {
        continue;
      }

      const result = this.trackSystem.findClosestPointOnSpline(
        track.spline,
        targetPosition
      );

      if (!bestResult || result.distance < bestResult.distance) {
        bestResult = {
          trackId,
          t: result.t,
          position: result.position,
          distance: result.distance,
        };
      }
    }

    return bestResult;
  }

  private isTrackOccupiedByOtherEntity(
    trackId: string,
    excludeEntityId: string
  ): boolean {
    for (const entity of this.entities.values()) {
      if (entity.id !== excludeEntityId && entity.currentTrack === trackId) {
        return true;
      }
    }
    return false;
  }

  private checkCollisionsForLinkedEntity(
    movingEntity: Entity,
    targetProgress: number
  ): {
    canMove: boolean;
    adjustedProgress: number;
    linkedEntity?: Entity;
  } {
    if (!movingEntity.currentTrack) {
      return { canMove: true, adjustedProgress: targetProgress };
    }

    // Get all linked entities to exclude them from collision detection
    const linkedEntityIds = this.getAllLinkedEntityIds(movingEntity);

    const entitiesOnSameTrack = this.getAllEntities().filter(
      (entity) =>
        entity.currentTrack === movingEntity.currentTrack &&
        entity.id !== movingEntity.id &&
        !linkedEntityIds.has(entity.id) // Exclude linked entities
    );

    console.log(
      `🔍 Checking ${entitiesOnSameTrack.length} entities for ${movingEntity.id}`
    );
    console.log(
      `   Entity ${movingEntity.id} at progress ${targetProgress} (${Math.round(
        targetProgress * 100
      )}%)`
    );

    // Create a temporary entity at target position to check distances
    const tempEntity: Entity = {
      ...movingEntity,
      trackProgress: targetProgress,
    };

    for (const otherEntity of entitiesOnSameTrack) {
      console.log(
        `   Other entity ${otherEntity.id} at progress ${
          otherEntity.trackProgress
        } (${Math.round(otherEntity.trackProgress * 100)}%)`
      );
      const centerDistance = this.getPixelDistanceBetweenEntities(
        tempEntity,
        otherEntity
      );
      const edgeDistance = this.getEdgeToEdgeDistance(tempEntity, otherEntity);
      console.log(
        `   Distance to entity ${
          otherEntity.id
        }: center=${centerDistance.toFixed(1)}px, edge=${edgeDistance.toFixed(
          1
        )}px (linking threshold: ${TRAIN_CAR.LINKING_DISTANCE}px)`
      );

      // Check if entities are close enough to link (use edge-to-edge distance)
      if (
        edgeDistance <= TRAIN_CAR.LINKING_DISTANCE &&
        !movingEntity.linkedCars.includes(otherEntity.id)
      ) {
        console.log(
          `🎯 Entity ${movingEntity.id} and entity ${
            otherEntity.id
          } are close enough to link (edge distance: ${edgeDistance.toFixed(
            1
          )}px)`
        );
        return {
          canMove: true,
          adjustedProgress: targetProgress,
          linkedEntity: otherEntity,
        };
      } else if (movingEntity.linkedCars.includes(otherEntity.id)) {
        console.log(
          `   Entity ${movingEntity.id} already linked to entity ${otherEntity.id}`
        );
      }

      // Check for collision (too close but not linking) - use minimum edge separation
      const minEdgeSeparation = 5; // Minimum gap between entities

      if (edgeDistance < minEdgeSeparation) {
        // Calculate adjusted position to maintain minimum separation
        const track = this.trackSystem.getTrack(movingEntity.currentTrack!);
        if (track) {
          const movingSize = this.getEntitySize(movingEntity);
          const otherSize = this.getEntitySize(otherEntity);
          const requiredCenterDistance =
            movingSize.width / 2 + otherSize.width / 2 + minEdgeSeparation;
          const progressDelta = this.pixelDistanceToProgressDelta(
            requiredCenterDistance,
            movingEntity.currentTrack!
          );
          const pushDirection =
            targetProgress > otherEntity.trackProgress ? 1 : -1;
          const adjustedProgress =
            otherEntity.trackProgress + pushDirection * progressDelta;

          console.log(
            `Collision detected between ${movingEntity.id} and ${
              otherEntity.id
            }, adjusting position (edge distance: ${edgeDistance.toFixed(1)}px)`
          );
          return {
            canMove: true,
            adjustedProgress: Math.max(0, Math.min(1, adjustedProgress)),
          };
        }
      }
    }

    return { canMove: true, adjustedProgress: targetProgress };
  }

  // DISTANCE CALCULATION METHODS
  private getPixelDistanceBetweenEntities(
    entity1: Entity,
    entity2: Entity
  ): number {
    if (entity1.currentTrack !== entity2.currentTrack) return Infinity;

    const track = this.trackSystem.getTrack(entity1.currentTrack!);
    if (!track) return Infinity;

    const pos1 = this.trackSystem.getPositionOnSpline(
      track.spline,
      entity1.trackProgress
    );
    const pos2 = this.trackSystem.getPositionOnSpline(
      track.spline,
      entity2.trackProgress
    );

    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  }

  private getEdgeToEdgeDistance(entity1: Entity, entity2: Entity): number {
    const centerDistance = this.getPixelDistanceBetweenEntities(
      entity1,
      entity2
    );
    if (centerDistance === Infinity) return Infinity;

    const size1 = this.getEntitySize(entity1);
    const size2 = this.getEntitySize(entity2);

    // Subtract half the width of each entity to get edge-to-edge distance
    const edgeDistance = centerDistance - size1.width / 2 - size2.width / 2;

    return Math.max(0, edgeDistance); // Don't return negative distances
  }

  private pixelDistanceToProgressDelta(
    pixelDistance: number,
    trackId: string
  ): number {
    const track = this.trackSystem.getTrack(trackId);
    if (!track) return 0;

    // Estimate total track length by sampling
    let totalLength = 0;
    const samples = 100;
    for (let i = 0; i < samples; i++) {
      const t1 = i / samples;
      const t2 = (i + 1) / samples;
      const pos1 = this.trackSystem.getPositionOnSpline(track.spline, t1);
      const pos2 = this.trackSystem.getPositionOnSpline(track.spline, t2);
      totalLength += Math.sqrt(
        Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
      );
    }

    // Convert pixel distance to progress delta
    return pixelDistance / totalLength;
  }

  private getAllLinkedEntityIds(entity: Entity): Set<string> {
    const linkedIds = new Set<string>();
    const queue = [entity.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (linkedIds.has(currentId)) continue;
      linkedIds.add(currentId);

      const currentEntity = this.entities.get(currentId);
      if (!currentEntity) continue;

      // Add all linked entities to the queue
      for (const linkedId of currentEntity.linkedCars) {
        if (!linkedIds.has(linkedId)) {
          queue.push(linkedId);
        }
      }
    }

    return linkedIds;
  }

  // LINKING LOGIC
  public linkEntities(entity1: Entity, entity2: Entity): boolean {
    console.log(
      `🔗 Linking entities: ${entity1.id} (${entity1.type}) <-> ${entity2.id} (${entity2.type})`
    );

    if (
      entity1.linkedCars.includes(entity2.id) ||
      entity2.linkedCars.includes(entity1.id)
    ) {
      console.log(
        `Entities ${entity1.id} and ${entity2.id} are already linked`
      );
      return false; // Already linked
    }

    // Handle locomotive-car linking
    if (this.isLocomotive(entity1) && this.isTrainCar(entity2)) {
      return this.linkLocomotiveToTrainCar(entity1, entity2);
    } else if (this.isTrainCar(entity1) && this.isLocomotive(entity2)) {
      return this.linkLocomotiveToTrainCar(entity2, entity1);
    } else if (this.isTrainCar(entity1) && this.isTrainCar(entity2)) {
      return this.linkTrainCars(entity1, entity2);
    }

    console.log(
      `Cannot link entities of types: ${entity1.type} and ${entity2.type}`
    );
    return false;
  }

  private linkLocomotiveToTrainCar(
    locomotive: Locomotive,
    car: TrainCar
  ): boolean {
    // Check if locomotive can accept this car type
    if (!locomotive.acceptedCarTypes.includes(car.type)) {
      console.log(
        `Locomotive ${locomotive.id} does not accept car type ${car.type}`
      );
      return false;
    }

    // Check if locomotive has capacity
    if (locomotive.linkedCars.length >= locomotive.maxCars) {
      console.log(
        `Locomotive ${locomotive.id} is at maximum capacity (${locomotive.maxCars} cars)`
      );
      return false;
    }

    // Link the entities
    locomotive.linkedCars.push(car.id);
    car.linkedCars.push(locomotive.id);

    // Set linking relationships
    car.linkedToFront = locomotive.id;
    locomotive.linkedToBack = car.id;

    // Only mark car as completed if it's linked to its target locomotive
    if (car.targetLocomotive === locomotive.id) {
      car.isCompleted = true;
      console.log(
        `✅ Car ${car.id} completed - linked to its target locomotive ${locomotive.id}`
      );
    } else {
      car.isCompleted = false;
      console.log(
        `⚠️ Car ${car.id} linked to locomotive ${locomotive.id}, but target is ${car.targetLocomotive}`
      );
    }

    // Position the car at fixed distance behind the locomotive
    this.positionEntityAtFixedDistance(locomotive, car);

    console.log(
      `🔗 Successfully linked locomotive ${locomotive.id} to car ${car.id}`
    );
    console.log(
      `   Locomotive ${locomotive.id} now has ${
        locomotive.linkedCars.length
      } linked cars: [${locomotive.linkedCars.join(", ")}]`
    );
    console.log(
      `   Car ${car.id} completion status: ${car.isCompleted} (target: ${car.targetLocomotive})`
    );
    return true;
  }

  private linkTrainCars(car1: TrainCar, car2: TrainCar): boolean {
    // Determine which car is in front based on track progress
    const frontCar = car1.trackProgress > car2.trackProgress ? car1 : car2;
    const backCar = car1.trackProgress > car2.trackProgress ? car2 : car1;

    // Set linking relationships
    frontCar.linkedToBack = backCar.id;
    backCar.linkedToFront = frontCar.id;

    // Add to linked cars arrays
    frontCar.linkedCars.push(backCar.id);
    backCar.linkedCars.push(frontCar.id);

    // Position the back car at the correct fixed distance from the front car
    this.positionEntityAtFixedDistance(frontCar, backCar);

    console.log(
      `Successfully linked cars: ${frontCar.id} (front) <-> ${backCar.id} (back)`
    );
    return true;
  }

  private positionEntityAtFixedDistance(
    referenceEntity: Entity,
    entityToPosition: Entity
  ): void {
    if (
      !referenceEntity.currentTrack ||
      referenceEntity.currentTrack !== entityToPosition.currentTrack
    )
      return;

    const track = this.trackSystem.getTrack(referenceEntity.currentTrack);
    if (!track) return;

    // Calculate target distance based on entity sizes and desired gap
    const refSize = this.getEntitySize(referenceEntity);
    const posSize = this.getEntitySize(entityToPosition);
    const desiredGap = 8; // Fixed gap between entities
    const targetDistance = refSize.width / 2 + posSize.width / 2 + desiredGap;

    // Determine direction: should entityToPosition be before or after referenceEntity?
    // Check the current relative positions to maintain the same side
    const currentRefPos = this.trackSystem.getPositionOnSpline(
      track.spline,
      referenceEntity.trackProgress
    );
    const currentEntityPos = this.trackSystem.getPositionOnSpline(
      track.spline,
      entityToPosition.trackProgress
    );

    // Determine if entity should be positioned to the left or right of reference
    const shouldBeToTheRight = currentEntityPos.x > currentRefPos.x;

    // Set search bounds based on direction
    let minProgress: number;
    let maxProgress: number;

    if (shouldBeToTheRight) {
      // Search for positions to the right (higher progress values)
      minProgress = referenceEntity.trackProgress;
      maxProgress = 1.0;
    } else {
      // Search for positions to the left (lower progress values)
      minProgress = 0;
      maxProgress = referenceEntity.trackProgress;
    }

    let bestProgress = entityToPosition.trackProgress;
    let bestDistance = Infinity;

    // Binary search with higher precision
    for (let iteration = 0; iteration < 20; iteration++) {
      const midProgress = (minProgress + maxProgress) / 2;

      const refPos = this.trackSystem.getPositionOnSpline(
        track.spline,
        referenceEntity.trackProgress
      );
      const testPos = this.trackSystem.getPositionOnSpline(
        track.spline,
        midProgress
      );
      const distance = Math.sqrt(
        Math.pow(testPos.x - refPos.x, 2) + Math.pow(testPos.y - refPos.y, 2)
      );

      if (
        Math.abs(distance - targetDistance) <
        Math.abs(bestDistance - targetDistance)
      ) {
        bestDistance = distance;
        bestProgress = midProgress;
      }

      // Adjust search bounds based on direction
      if (shouldBeToTheRight) {
        if (distance < targetDistance) {
          minProgress = midProgress;
        } else {
          maxProgress = midProgress;
        }
      } else {
        if (distance < targetDistance) {
          maxProgress = midProgress;
        } else {
          minProgress = midProgress;
        }
      }
    }

    // Update the entity's position
    entityToPosition.trackProgress = bestProgress;
    const splinePos = this.trackSystem.getPositionOnSpline(
      track.spline,
      bestProgress
    );

    // Calculate position offset based on entity size
    const entitySize = this.getEntitySize(entityToPosition);
    const offsetX = entitySize.width / 2;
    const offsetY = entitySize.height / 2;

    entityToPosition.position = {
      x: splinePos.x - offsetX,
      y: splinePos.y - offsetY,
    };

    const direction = shouldBeToTheRight ? "right" : "left";
    console.log(
      `Positioned entity ${entityToPosition.id} to the ${direction} of ${
        referenceEntity.id
      } at ${targetDistance}px target distance (actual: ${bestDistance.toFixed(
        1
      )}px, gap: ${desiredGap}px)`
    );
  }

  private moveLinkedEntitiesRelative(
    draggedEntity: Entity,
    deltaProgress: number
  ): void {
    console.log(
      `Moving linked entities for ${draggedEntity.id} with delta ${deltaProgress}`
    );

    // Get all linked entities in order (front to back)
    const linkedEntities = this.getLinkedEntitiesInOrder(draggedEntity);

    // Debug: Show the chain order and track progress
    console.log(`Chain order (front to back):`);
    linkedEntities.forEach((entity, index) => {
      console.log(
        `  ${index}: ${entity.id} at progress ${entity.trackProgress.toFixed(
          3
        )} (${entity.trackProgress > 0.5 ? "right" : "left"} side)`
      );
    });

    // Update positions maintaining fixed spacing
    for (let i = 0; i < linkedEntities.length; i++) {
      const entity = linkedEntities[i];
      if (entity.id === draggedEntity.id) continue; // Skip the dragged entity

      // Find the entity in front of this one
      const frontEntity = i > 0 ? linkedEntities[i - 1] : null;
      if (frontEntity) {
        // Position this entity at fixed distance behind the front entity
        this.positionEntityAtFixedDistance(frontEntity, entity);
      } else {
        // This shouldn't happen in a well-formed chain, but handle it gracefully
        const newProgress = Math.max(
          0,
          Math.min(1, entity.trackProgress + deltaProgress)
        );
        entity.trackProgress = newProgress;

        if (entity.currentTrack) {
          const track = this.trackSystem.getTrack(entity.currentTrack);
          if (track) {
            const splinePos = this.trackSystem.getPositionOnSpline(
              track.spline,
              newProgress
            );
            const entitySize = this.getEntitySize(entity);
            entity.position = {
              x: splinePos.x - entitySize.width / 2,
              y: splinePos.y - entitySize.height / 2,
            };
          }
        }
      }
    }

    console.log(
      `Updated positions for ${
        linkedEntities.length - 1
      } linked entities maintaining fixed spacing`
    );
  }

  private getLinkedEntitiesInOrder(startEntity: Entity): Entity[] {
    const visited = new Set<string>();
    const entities: Entity[] = [];

    // Find the front-most entity
    let frontEntity = startEntity;
    while (frontEntity.linkedToFront) {
      const nextEntity = this.entities.get(frontEntity.linkedToFront);
      if (!nextEntity || visited.has(nextEntity.id)) break;
      frontEntity = nextEntity;
      visited.add(nextEntity.id);
    }

    // Build the chain from front to back
    visited.clear();
    let currentEntity: Entity | undefined = frontEntity;

    while (currentEntity && !visited.has(currentEntity.id)) {
      visited.add(currentEntity.id);
      entities.push(currentEntity);

      // Move to the next entity in the chain
      const nextEntityId: string | undefined = currentEntity.linkedToBack;
      currentEntity = nextEntityId
        ? this.entities.get(nextEntityId)
        : undefined;
    }

    return entities;
  }

  // Convenience methods for backward compatibility
  public linkCars(car1: TrainCar, car2: TrainCar): void {
    this.linkEntities(car1, car2);
  }

  public linkCarToLocomotive(car: TrainCar, locomotive: Locomotive): boolean {
    return this.linkEntities(car, locomotive);
  }

  public removeCar(carId: string): void {
    this.removeEntity(carId);
  }

  public removeLocomotive(locomotiveId: string): void {
    this.removeEntity(locomotiveId);
  }

  // Level completion check
  public checkLevelCompletion(requiredConnections: any[]): boolean {
    console.log(
      `🔍 Checking level completion with ${requiredConnections.length} required connections`
    );

    // Check if all required connections are satisfied
    for (const connection of requiredConnections) {
      console.log(
        `Checking connection: car ${connection.carId} -> locomotive ${connection.locomotiveId}`
      );

      const car = this.getCar(connection.carId);
      const locomotive = this.getLocomotive(connection.locomotiveId);

      if (!car) {
        console.log(`❌ Car ${connection.carId} not found`);
        return false;
      }

      if (!locomotive) {
        console.log(`❌ Locomotive ${connection.locomotiveId} not found`);
        return false;
      }

      // Check if the specific car is linked to the specific locomotive
      const isCarLinkedToLocomotive = car.linkedCars.includes(locomotive.id);
      const isLocomotiveLinkedToCar = locomotive.linkedCars.includes(car.id);

      if (!isCarLinkedToLocomotive || !isLocomotiveLinkedToCar) {
        console.log(
          `❌ Car ${car.id} is not properly linked to locomotive ${locomotive.id}`
        );
        console.log(`   Car's linked entities: [${car.linkedCars.join(", ")}]`);
        console.log(
          `   Locomotive's linked entities: [${locomotive.linkedCars.join(
            ", "
          )}]`
        );
        return false;
      }

      // Verify the car's target locomotive matches
      if (car.targetLocomotive !== locomotive.id) {
        console.log(
          `❌ Car ${car.id} target locomotive (${car.targetLocomotive}) doesn't match required locomotive (${locomotive.id})`
        );
        return false;
      }

      console.log(
        `✅ Car ${car.id} is correctly linked to locomotive ${locomotive.id}`
      );
    }

    console.log("🎉 All level completion requirements satisfied!");
    return true;
  }
}
