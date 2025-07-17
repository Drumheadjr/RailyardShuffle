# Level 2 - S-Curve Track Design

## Overview

Level 2 features a curved S-shaped spline track that provides a more visually interesting and challenging layout compared to Level 1's straight track.

## Track Design

### Spline Points
The S-curve is created using 4 control points:

```
Point 1: Start (0, 30% height)           ●
                                        /
Point 2: Control (35% width, 70% height)  ●
                                            \
Point 3: Control (65% width, 30% height)    ●
                                              \
Point 4: End (100% width, 70% height)         ●
```

### Visual Representation
```
Play Area (800x600 default)

Y=180 (30%) ●─────────────────────────────────────●  Y=180 (30%)
            │                                     │
            │                                     │
            │        ●                     ●      │
            │       /                       \     │
            │      /                         \    │
            │     /                           \   │
            │    /                             \  │
            │   /                               \ │
Y=420 (70%) ●─/─────────────────────────────────\─●  Y=420 (70%)
           X=0                                   X=800
              X=280 (35%)              X=520 (65%)
```

## Entity Positions

### Locomotives
- **Blue Locomotive** (Non-draggable): 75% progress - On the second curve
- **Red Locomotive** (Draggable): 90% progress - Near the end

### Train Cars
- **Red Car 1** (Draggable): 10% progress - Start of the S-curve
- **Blue Car** (Non-draggable): 30% progress - First curve section
- **Red Car 2** (Draggable): 50% progress - Middle of the S-curve

## Track Configuration

```typescript
{
  id: 'main_track',
  type: 'CURVE',
  points: [
    { x: 0, y: PLAY_AREA.DEFAULT_HEIGHT * 0.3 },           // Start (top-left)
    { x: PLAY_AREA.DEFAULT_WIDTH * 0.35, y: PLAY_AREA.DEFAULT_HEIGHT * 0.7 }, // Control 1 (bottom-left)
    { x: PLAY_AREA.DEFAULT_WIDTH * 0.65, y: PLAY_AREA.DEFAULT_HEIGHT * 0.3 }, // Control 2 (top-right)
    { x: PLAY_AREA.DEFAULT_WIDTH, y: PLAY_AREA.DEFAULT_HEIGHT * 0.7 }          // End (bottom-right)
  ]
}
```

## Gameplay Features

### Draggable Testing
- **Draggable Entities**: Red locomotive and red cars
- **Non-draggable Entities**: Blue locomotive and blue car

### Visual Differences from Level 1
1. **Curved Track**: S-shaped spline vs straight line
2. **Varied Heights**: Entities positioned at different Y coordinates
3. **Dynamic Layout**: More interesting visual composition
4. **Challenge**: Curved track makes linking more challenging

## Technical Implementation

### Spline Rendering
The SplineTrackSystem handles the curved track rendering using:
- Cubic Bezier curves for smooth S-shape
- Multiple control points for proper curvature
- Interpolation along the curve for entity positioning

### Entity Positioning
Entities are positioned using progress values (0-1) along the spline:
- Progress 0.0: Start point (top-left)
- Progress 0.25: First curve
- Progress 0.5: Middle transition
- Progress 0.75: Second curve
- Progress 1.0: End point (bottom-right)

## Benefits

1. **Visual Appeal**: More interesting than straight tracks
2. **Gameplay Variety**: Different challenge from Level 1
3. **Testing Platform**: Good for testing spline rendering and entity movement
4. **Draggable Demo**: Clear demonstration of draggable vs non-draggable entities

The S-curve design provides an excellent testing ground for the new entity system while offering players a more engaging visual experience.
