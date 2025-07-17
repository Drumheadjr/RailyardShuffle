import { Locomotive as ILocomotive, TrainCarType } from "@/types/railyard";
import { Entity } from "./Entity";

// Locomotive class
export class Locomotive extends Entity {
  public acceptedCarTypes: TrainCarType[];
  public maxCars: number;
  public isActive: boolean;

  constructor(data: ILocomotive & { isDraggable?: boolean }) {
    super(data);
    this.acceptedCarTypes = data.acceptedCarTypes;
    this.maxCars = data.maxCars;
    this.isActive = data.isActive;
    // Locomotives are draggable by default
    this.isDraggable = data.isDraggable ?? true;
  }

  public getEntitySize(): { width: number; height: number } {
    return { width: this.size.x, height: this.size.y };
  }
}
