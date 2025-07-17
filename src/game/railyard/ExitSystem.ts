import { Vector2 } from '@/types';
import { Exit, ExitSide, TrainCar } from '@/types/railyard';
import { TrackSystem } from './TrackSystem';
import { TrainCarSystem } from './TrainCarSystem';

export class ExitSystem {
  private exits: Map<string, Exit> = new Map();
  // private trackSystem: TrackSystem; // Reserved for future use
  private trainCarSystem: TrainCarSystem;
  private playAreaSize: Vector2;

  constructor(_trackSystem: TrackSystem, trainCarSystem: TrainCarSystem, playAreaSize: Vector2) {
    // this.trackSystem = trackSystem; // Reserved for future use
    this.trainCarSystem = trainCarSystem;
    this.playAreaSize = playAreaSize;
  }

  public addExit(exit: Exit): void {
    this.exits.set(exit.id, exit);
    console.log(`Added exit ${exit.id} on ${exit.side} side`);
  }

  public getExit(id: string): Exit | undefined {
    return this.exits.get(id);
  }

  public getAllExits(): Exit[] {
    return Array.from(this.exits.values());
  }

  public createExit(
    id: string,
    side: ExitSide,
    positionPercent: number, // 0-1 along the side
    connectedTrackId: string,
    color?: string,
    acceptedCarColors?: string[]
  ): Exit {
    const position = this.calculateExitPosition(side, positionPercent);
    const size = this.calculateExitSize(side);

    const exit: Exit = {
      id,
      side,
      position,
      size,
      connectedTrack: connectedTrackId,
      color,
      acceptedCarColors
    };

    this.addExit(exit);
    return exit;
  }

  private calculateExitPosition(side: ExitSide, positionPercent: number): Vector2 {
    const exitWidth = 60;
    const exitHeight = 40;
    
    switch (side) {
      case ExitSide.TOP:
        return {
          x: positionPercent * (this.playAreaSize.x - exitWidth),
          y: -exitHeight / 2
        };
      
      case ExitSide.BOTTOM:
        return {
          x: positionPercent * (this.playAreaSize.x - exitWidth),
          y: this.playAreaSize.y - exitHeight / 2
        };
      
      case ExitSide.LEFT:
        return {
          x: -exitWidth / 2,
          y: positionPercent * (this.playAreaSize.y - exitHeight)
        };
      
      case ExitSide.RIGHT:
        return {
          x: this.playAreaSize.x - exitWidth / 2,
          y: positionPercent * (this.playAreaSize.y - exitHeight)
        };
      
      default:
        return { x: 0, y: 0 };
    }
  }

  private calculateExitSize(side: ExitSide): Vector2 {
    const exitWidth = 60;
    const exitHeight = 40;
    
    switch (side) {
      case ExitSide.TOP:
      case ExitSide.BOTTOM:
        return { x: exitWidth, y: exitHeight };
      
      case ExitSide.LEFT:
      case ExitSide.RIGHT:
        return { x: exitHeight, y: exitWidth };
      
      default:
        return { x: exitWidth, y: exitHeight };
    }
  }

  public checkCarAtExit(car: TrainCar): Exit | null {
    for (const exit of this.exits.values()) {
      if (this.isCarAtExit(car, exit)) {
        return exit;
      }
    }
    return null;
  }

  private isCarAtExit(car: TrainCar, exit: Exit): boolean {
    // Check if car is close enough to the exit
    const carCenter = {
      x: car.position.x + car.size.x / 2,
      y: car.position.y + car.size.y / 2
    };
    
    const exitCenter = {
      x: exit.position.x + exit.size.x / 2,
      y: exit.position.y + exit.size.y / 2
    };
    
    const distance = Math.sqrt(
      Math.pow(carCenter.x - exitCenter.x, 2) +
      Math.pow(carCenter.y - exitCenter.y, 2)
    );
    
    // Car must be within exit area and on the connected track
    return distance < 30 && car.currentTrack === exit.connectedTrack;
  }

  public canCarUseExit(car: TrainCar, exit: Exit): boolean {
    // Check if car color is accepted by this exit
    if (exit.acceptedCarColors && exit.acceptedCarColors.length > 0) {
      return exit.acceptedCarColors.includes(car.color);
    }
    
    // If no color restrictions, any car can use this exit
    return true;
  }

  public moveCarToExit(carId: string, exitId: string): boolean {
    const car = this.trainCarSystem.getCar(carId);
    const exit = this.exits.get(exitId);
    
    if (!car || !exit) {
      console.warn(`Cannot move car ${carId} to exit ${exitId}: not found`);
      return false;
    }
    
    // Check if car can use this exit
    if (!this.canCarUseExit(car, exit)) {
      console.warn(`Car ${carId} cannot use exit ${exitId}: color mismatch`);
      return false;
    }
    
    // Check if car can reach the exit track
    if (!this.trainCarSystem.canMoveCar(carId, exit.connectedTrack)) {
      console.warn(`Car ${carId} cannot reach exit ${exitId}: path blocked`);
      return false;
    }
    
    // Move car to exit track
    if (this.trainCarSystem.moveCar(carId, exit.connectedTrack, 1.0)) {
      // Position car at exit
      car.position = this.getExitCarPosition(exit);
      car.isAtExit = true;
      car.targetExit = exitId;
      
      console.log(`Car ${carId} successfully moved to exit ${exitId}`);
      return true;
    }
    
    return false;
  }

  private getExitCarPosition(exit: Exit): Vector2 {
    // Position car at the exit entrance
    switch (exit.side) {
      case ExitSide.TOP:
        return {
          x: exit.position.x + exit.size.x / 2 - 15, // Center car on exit
          y: exit.position.y + exit.size.y
        };
      
      case ExitSide.BOTTOM:
        return {
          x: exit.position.x + exit.size.x / 2 - 15,
          y: exit.position.y - 30 // Car height
        };
      
      case ExitSide.LEFT:
        return {
          x: exit.position.x + exit.size.x,
          y: exit.position.y + exit.size.y / 2 - 15
        };
      
      case ExitSide.RIGHT:
        return {
          x: exit.position.x - 30, // Car width
          y: exit.position.y + exit.size.y / 2 - 15
        };
      
      default:
        return exit.position;
    }
  }

  public update(_deltaTime: number): void {
    // Check all cars for exit proximity
    const cars = this.trainCarSystem.getAllCars();
    
    for (const car of cars) {
      if (car.isAtExit) continue; // Already at exit
      
      const nearbyExit = this.checkCarAtExit(car);
      if (nearbyExit && this.canCarUseExit(car, nearbyExit)) {
        // Automatically move car to exit if it's close enough
        this.moveCarToExit(car.id, nearbyExit.id);
      }
    }
  }

  public getExitsForCar(car: TrainCar): Exit[] {
    return Array.from(this.exits.values()).filter(exit => this.canCarUseExit(car, exit));
  }

  public getCompletedCars(): string[] {
    const completedCars: string[] = [];
    const cars = this.trainCarSystem.getAllCars();
    
    for (const car of cars) {
      if (car.isAtExit) {
        completedCars.push(car.id);
      }
    }
    
    return completedCars;
  }

  public isLevelComplete(requiredExits: { carId: string; exitId: string }[]): boolean {
    for (const requirement of requiredExits) {
      const car = this.trainCarSystem.getCar(requirement.carId);
      if (!car || !car.isAtExit || car.targetExit !== requirement.exitId) {
        return false;
      }
    }
    return true;
  }

  public reset(): void {
    // Reset all cars' exit status
    const cars = this.trainCarSystem.getAllCars();
    for (const car of cars) {
      car.isAtExit = false;
      car.targetExit = undefined;
    }
  }

  public removeExit(exitId: string): void {
    this.exits.delete(exitId);
  }

  public getExitAtPosition(position: Vector2): Exit | null {
    for (const exit of this.exits.values()) {
      if (this.isPositionInExit(position, exit)) {
        return exit;
      }
    }
    return null;
  }

  private isPositionInExit(position: Vector2, exit: Exit): boolean {
    return position.x >= exit.position.x &&
           position.x <= exit.position.x + exit.size.x &&
           position.y >= exit.position.y &&
           position.y <= exit.position.y + exit.size.y;
  }
}
