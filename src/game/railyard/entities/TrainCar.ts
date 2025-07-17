import { TrainCar as ITrainCar } from "@/types/railyard";
import { TRAIN_CAR } from "@/constants/railyard";
import { Entity } from "./Entity";

// TrainCar class
export class TrainCar extends Entity {
  public targetLocomotive?: string;

  constructor(data: ITrainCar & { isDraggable?: boolean }) {
    super(data);
    this.targetLocomotive = data.targetLocomotive;
    // Train cars are draggable unless completed by default
    this.isDraggable = data.isDraggable ?? !data.isCompleted;
  }

  public getEntitySize(): { width: number; height: number } {
    return { width: TRAIN_CAR.WIDTH, height: TRAIN_CAR.HEIGHT };
  }
}
