import { Vector2 } from "@/types";
import { TrainCarType, BaseTrainCar } from "@/types/railyard";

// Base Entity class
export abstract class Entity {
  public id: string;
  public type: TrainCarType;
  public position: Vector2;
  public size: Vector2;
  public currentTrack: string | null;
  public trackProgress: number;
  public color: string;
  public isDragging: boolean;
  public isCompleted: boolean;
  public linkedCars: string[];
  public linkedToFront?: string;
  public linkedToBack?: string;
  public isDraggable: boolean;

  constructor(data: BaseTrainCar & { isDraggable?: boolean }) {
    this.id = data.id;
    this.type = data.type;
    this.position = data.position;
    this.size = data.size;
    this.currentTrack = data.currentTrack;
    this.trackProgress = data.trackProgress;
    this.color = data.color;
    this.isDragging = data.isDragging;
    this.isCompleted = data.isCompleted;
    this.linkedCars = data.linkedCars;
    this.linkedToFront = data.linkedToFront;
    this.linkedToBack = data.linkedToBack;
    this.isDraggable = data.isDraggable ?? true; // Default to draggable
  }

  // Abstract methods that subclasses must implement
  abstract getEntitySize(): { width: number; height: number };
}
