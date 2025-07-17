# File Organization - Entity System

## Overview

The entity system has been reorganized into a clean, modular structure that separates concerns and improves maintainability.

## New File Structure

```
src/game/railyard/
├── entities/                    # Entity classes folder
│   ├── index.ts                # Barrel exports for all entities
│   ├── Entity.ts               # Abstract base Entity class
│   ├── TrainCar.ts            # TrainCar class implementation
│   ├── Locomotive.ts          # Locomotive class implementation
│   └── README.md              # Documentation for entities folder
├── EntitySystem.ts            # Entity management system (updated)
├── SplineLevelBuilder.ts      # Level builder (updated imports)
└── SplineRailyardScene.ts     # Game scene (no changes needed)
```

## Benefits of This Organization

### 1. **Separation of Concerns**
- Each entity type has its own file
- Base functionality is isolated in the abstract Entity class
- Entity management logic remains in EntitySystem

### 2. **Improved Maintainability**
- Easy to find and modify specific entity types
- Clear inheritance hierarchy
- Reduced file size and complexity

### 3. **Better Scalability**
- Simple to add new entity types
- Consistent pattern for extending the system
- Modular imports allow for tree-shaking

### 4. **Enhanced Developer Experience**
- Better IntelliSense and autocomplete
- Clearer error messages
- Easier debugging and testing

## Import Patterns

### Barrel Imports (Recommended)
```typescript
// Import all entities at once
import { Entity, TrainCar, Locomotive } from '@/game/railyard/entities';
```

### Specific Imports
```typescript
// Import only what you need
import { TrainCar } from '@/game/railyard/entities/TrainCar';
import { Locomotive } from '@/game/railyard/entities/Locomotive';
```

### Mixed Imports
```typescript
// Import base class and specific implementations
import { Entity } from '@/game/railyard/entities/Entity';
import { TrainCar, Locomotive } from '@/game/railyard/entities';
```

## Migration Notes

### What Changed
1. **Entity classes moved** from `EntitySystem.ts` to individual files in `entities/` folder
2. **Import statements updated** in `EntitySystem.ts` and `SplineLevelBuilder.ts`
3. **Barrel export added** in `entities/index.ts` for convenient importing

### What Stayed the Same
- All public APIs remain unchanged
- Entity functionality is identical
- Game behavior is preserved
- Existing level configurations work without modification

### Files Updated
- `src/game/railyard/EntitySystem.ts` - Updated imports
- `src/game/railyard/SplineLevelBuilder.ts` - Updated imports
- `src/main.ts` - Added Level 2 registration

### Files Added
- `src/game/railyard/entities/Entity.ts`
- `src/game/railyard/entities/TrainCar.ts`
- `src/game/railyard/entities/Locomotive.ts`
- `src/game/railyard/entities/index.ts`
- `src/game/railyard/entities/README.md`
- `src/game/levels/RailyardLevel2Scene.ts`

## Future Enhancements

This organization makes it easy to:

1. **Add new entity types** (e.g., `SpecialCar`, `ElectricLocomotive`)
2. **Implement entity-specific behaviors** (e.g., different movement patterns)
3. **Add entity mixins or traits** (e.g., `Powered`, `Cargo`, `Passenger`)
4. **Create entity factories** for complex entity creation logic
5. **Implement entity serialization** for save/load functionality

## Testing

The reorganization includes a test level (Level 2) that demonstrates:
- Entities with different `isDraggable` settings
- Mixed entity types on the same track
- Proper inheritance and polymorphism

Access the test level by:
1. Starting the game
2. Going to Level Select
3. Choosing "Level 2: Draggable Test"
