# Railyard Entities

This folder contains the entity classes for the railyard game system.

## Files

### `Entity.ts`
Abstract base class that defines the common interface and properties for all game entities. All other entity types extend from this class.

**Key Features:**
- Common properties (id, position, size, etc.)
- `isDraggable` property to control drag behavior
- Abstract `getEntitySize()` method that subclasses must implement

### `TrainCar.ts`
Concrete implementation for train car entities.

**Specific Properties:**
- `targetLocomotive`: ID of the locomotive this car should connect to
- Default draggable behavior: `!isCompleted` (draggable unless completed)

### `Locomotive.ts`
Concrete implementation for locomotive entities.

**Specific Properties:**
- `acceptedCarTypes`: Array of car types this locomotive can pull
- `maxCars`: Maximum number of cars this locomotive can handle
- `isActive`: Whether the locomotive is currently accepting cars
- Default draggable behavior: `true` (always draggable by default)

### `index.ts`
Barrel export file that re-exports all entity classes for convenient importing.

## Usage

```typescript
// Import all entities
import { Entity, TrainCar, Locomotive } from '@/game/railyard/entities';

// Import specific entities
import { TrainCar } from '@/game/railyard/entities/TrainCar';

// Create entities
const car = new TrainCar({
  id: 'car1',
  type: TrainCarType.REGULAR,
  // ... other properties
  isDraggable: false // Override default behavior
});

const locomotive = new Locomotive({
  id: 'loco1',
  type: TrainCarType.LOCOMOTIVE,
  // ... other properties
  isDraggable: true
});
```

## Extending the System

To add new entity types:

1. Create a new file in this folder (e.g., `SpecialCar.ts`)
2. Extend the `Entity` base class
3. Implement the required `getEntitySize()` method
4. Add any type-specific properties and methods
5. Export the new class in `index.ts`

Example:
```typescript
// SpecialCar.ts
import { Entity } from './Entity';

export class SpecialCar extends Entity {
  public specialProperty: string;

  constructor(data: ISpecialCar & { isDraggable?: boolean }) {
    super(data);
    this.specialProperty = data.specialProperty;
  }

  public getEntitySize(): { width: number; height: number } {
    return { width: 60, height: 30 }; // Custom size
  }
}
```
