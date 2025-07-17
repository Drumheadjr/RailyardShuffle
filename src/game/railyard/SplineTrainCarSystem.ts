import { Vector2 } from '@/types';
import { TrainCar, Locomotive } from '@/types/railyard';
import { SplineTrackSystem } from './SplineTrackSystem';
import { BaseLinkableEntitySystem, LinkableEntity } from './BaseLinkableEntitySystem';
import { TRAIN_CAR } from '@/constants/railyard';

export class SplineTrainCarSystem extends BaseLinkableEntitySystem {
  constructor(trackSystem: SplineTrackSystem) {
    super(trackSystem);
  }

  // Entity-specific behavior implementations (required abstract methods)
  protected isDraggable(entity: LinkableEntity): boolean {
    return this.isTrainCar(entity) && !entity.isCompleted;
  }

  protected isMovable(entity: LinkableEntity): boolean {
    return this.isTrainCar(entity);
  }

  protected getEntitySize(entity: LinkableEntity): { width: number; height: number } {
    if (this.isLocomotive(entity)) {
      return { width: entity.size.x, height: entity.size.y };
    } else {
      return { width: TRAIN_CAR.WIDTH, height: TRAIN_CAR.HEIGHT };
    }
  }

  // Car-specific wrapper methods for backward compatibility
  public addCar(car: TrainCar): void {
    this.addEntity(car);
  }

  public getCar(id: string): TrainCar | undefined {
    const entity = this.getEntity(id);
    return entity && this.isTrainCar(entity) ? entity : undefined;
  }

  public getAllCars(): TrainCar[] {
    return this.getAllEntities().filter(this.isTrainCar);
  }

  // Locomotive wrapper methods for linking purposes
  public addLocomotive(locomotive: Locomotive): void {
    this.addEntity(locomotive);
  }

  public getLocomotive(id: string): Locomotive | undefined {
    const entity = this.getEntity(id);
    return entity && this.isLocomotive(entity) ? entity : undefined;
  }

  public getAllLocomotives(): Locomotive[] {
    return this.getAllEntities().filter(this.isLocomotive);
  }

  // Linking wrapper methods
  public linkCars(car1: TrainCar, car2: TrainCar): void {
    this.linkEntities(car1, car2);
  }

  public linkCarToLocomotive(car: TrainCar, locomotive: Locomotive): boolean {
    return this.linkEntities(car, locomotive);
  }

  // Utility wrapper methods
  public getCarAtPosition(position: Vector2): TrainCar | null {
    const entity = this.getEntityAtPosition(position);
    return entity && this.isTrainCar(entity) ? entity : null;
  }

  public removeCar(carId: string): void {
    this.removeEntity(carId);
  }

  // getDragState() is now inherited from BaseLinkableEntitySystem
}
