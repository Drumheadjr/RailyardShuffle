# Entity System Refactor

## Overview

The railyard game's entity system has been refactored to use proper object-oriented design with class inheritance. This provides better type safety, encapsulation, and extensibility.

## File Structure

The entity classes have been organized into their own folder for better organization:

```
src/game/railyard/entities/
├── index.ts          # Exports all entity classes
├── Entity.ts         # Base abstract Entity class
├── TrainCar.ts       # TrainCar class extending Entity
└── Locomotive.ts     # Locomotive class extending Entity
```

## New Class Hierarchy

### Base Entity Class
```typescript
abstract class Entity {
  // Common properties for all entities
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
  public isDraggable: boolean; // NEW: Controls if entity can be dragged

  // Abstract method that subclasses must implement
  abstract getEntitySize(): { width: number; height: number };
}
```

### TrainCar Class
```typescript
class TrainCar extends Entity {
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
```

### Locomotive Class
```typescript
class Locomotive extends Entity {
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
```

## Key Features

### 1. Draggable Property
Each entity now has an `isDraggable` boolean property that controls whether the entity can be dragged by the player.

- **Default behavior:**
  - Locomotives: `isDraggable = true`
  - Train cars: `isDraggable = !isCompleted` (draggable unless completed)

- **Configuration:** Can be overridden in level configuration:
```typescript
locomotives: [
  {
    id: 'fixed_locomotive',
    // ... other properties
    isDraggable: false // This locomotive cannot be dragged
  }
],
cars: [
  {
    // ... other properties
    isDraggable: false // This car cannot be dragged
  }
]
```

### 2. Type Safety
- Uses proper TypeScript classes instead of plain objects
- Type guards now use `instanceof` checks
- Better IntelliSense and compile-time error checking

### 3. Encapsulation
- Entity-specific logic is contained within the respective classes
- Size calculation is handled by each entity type
- Easier to extend with new entity types

## Usage Examples

### Importing Entities
```typescript
// Import from the entities folder
import { Entity, TrainCar, Locomotive } from '@/game/railyard/entities';

// Or import individual classes
import { TrainCar } from '@/game/railyard/entities/TrainCar';
import { Locomotive } from '@/game/railyard/entities/Locomotive';
```

### Creating Entities
```typescript
// Old way (plain objects)
const car = {
  id: 'car1',
  type: TrainCarType.REGULAR,
  // ... all properties
};

// New way (classes)
const car = new TrainCar({
  id: 'car1',
  type: TrainCarType.REGULAR,
  // ... other properties
  isDraggable: true
});
```

### Checking Draggability
```typescript
// In EntitySystem
public isDraggable(entity: Entity): boolean {
  return entity.isDraggable; // Simply return the property
}
```

### Level Configuration
```typescript
// In level configuration
{
  locomotives: [
    {
      id: 'locomotive1',
      isDraggable: false // Not draggable
    }
  ],
  cars: [
    {
      id: 'car1',
      isDraggable: true // Draggable
    },
    {
      id: 'car2',
      isDraggable: false // Not draggable
    }
  ]
}
```

## Testing

A test level (Level 2) has been created to demonstrate the draggable functionality:
- Red locomotive: draggable
- Blue locomotive: not draggable
- Red cars: draggable
- Blue car: not draggable

## Migration Notes

- The EntitySystem now creates proper Entity instances instead of plain objects
- Type guards use `instanceof` instead of property checks
- Backward compatibility is maintained through the existing API methods
- The `isDraggable` property defaults to sensible values if not specified

## Future Enhancements

This new architecture makes it easy to add:
- New entity types (e.g., specialized cars, different locomotive types)
- Entity-specific behaviors and properties
- More granular control over entity interactions
- Custom rendering logic per entity type
