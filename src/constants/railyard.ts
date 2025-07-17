/**
 * Centralized constants for the railyard game system
 * All size, position, and dimension values should be defined here
 * to ensure consistency across the entire game
 */

// Track System Constants
export const TRACK = {
  SIZE: 40,                    // Standard track segment size (width and height)
  RAIL_WIDTH: 4,              // Width of the rail lines
  RAIL_OFFSET_1: 15,          // Position of first rail line from top/left
  RAIL_OFFSET_2: 25,          // Position of second rail line from top/left
  SPACING: 40,                // Distance between track centers
  BORDER_WIDTH: 2,            // Width of track border for curves/intersections
  BORDER_OFFSET: 2            // Offset for track borders
} as const;

// Train Car Constants
export const TRAIN_CAR = {
  WIDTH: 50,                  // Train car width (increased for better boxcar proportions)
  HEIGHT: 22,                 // Train car height (adjusted for ~2.3:1 aspect ratio)
  BORDER_WIDTH: 2,            // Normal border width
  DRAG_BORDER_WIDTH: 3,       // Border width when dragging
  SHADOW_OFFSET: 2,           // Shadow offset when not dragging
  DETAIL_SIZE: 5,             // Size of car detail squares
  DETAIL_OFFSET: 5,           // Offset of details from car edges
  LINKING_DISTANCE: 50,       // Fixed pixel distance for linking cars
  LINKED_CAR_SPACING: 45      // Fixed pixel spacing between linked cars (adjusted for new width)
} as const;

// Locomotive Constants
export const LOCOMOTIVE = {
  WIDTH: 55,                  // Locomotive width (slightly larger than train cars)
  HEIGHT: 28,                 // Locomotive height (proportionally larger)
  BORDER_WIDTH: 3,            // Thicker border for locomotives
  CHIMNEY_WIDTH: 8,           // Chimney width
  CHIMNEY_HEIGHT: 8,          // Chimney height
  FRONT_DETAIL_WIDTH: 6,      // Front detail width
  FRONT_DETAIL_MARGIN: 5      // Margin for front detail positioning
} as const;

// Exit Constants
export const EXIT = {
  WIDTH: 60,                  // Exit width
  HEIGHT: 40,                 // Exit height
  BORDER_WIDTH: 3,            // Exit border width
  ARROW_FONT_SIZE: 20         // Font size for exit arrow
} as const;

// Play Area Constants
export const PLAY_AREA = {
  DEFAULT_WIDTH: 800,         // Default play area width
  DEFAULT_HEIGHT: 600,        // Default play area height
  MARGIN: 20                  // Margin from edges
} as const;

// Drag System Constants
export const DRAG = {
  MAX_DISTANCE: 5,            // Maximum distance for valid move positions
  PROGRESS_STEPS: 0.25,       // Progress increment for position calculation (0, 0.25, 0.5, 0.75, 1.0)
  HIGHLIGHT_ALPHA: 0.3,       // Alpha value for drag highlight overlay
  LERP_FACTOR: 0.01          // Lerp factor for smooth car positioning
} as const;

// Level Configuration Constants
export const LEVEL = {
  TRACK_SPACING: TRACK.SPACING,  // Spacing between track segments
  CAR_PROGRESS_DEFAULT: 0.5,     // Default progress along track for cars
  EXIT_POSITION_DEFAULT: 0.5     // Default position along exit side
} as const;

// UI Constants
export const UI = {
  FONT_SIZE_TITLE: 24,        // Level title font size
  FONT_SIZE_OBJECTIVE: 16,    // Objective text font size
  FONT_SIZE_SCORE: 18,        // Score font size
  FONT_SIZE_INSTRUCTIONS: 14, // Instructions font size
  FONT_SIZE_COMPLETION: 48,   // Completion message font size
  FONT_SIZE_COMPLETION_SUB: 24, // Completion sub-message font size
  
  MARGIN_TOP: 40,             // Top margin for title
  MARGIN_OBJECTIVE: 70,       // Top margin for objective
  MARGIN_BOTTOM_SCORE: 60,    // Bottom margin for score
  MARGIN_BOTTOM_INST1: 40,    // Bottom margin for first instruction
  MARGIN_BOTTOM_INST2: 20,    // Bottom margin for second instruction
  
  COMPLETION_OFFSET_Y: -50,   // Y offset for completion title
  COMPLETION_SUB_OFFSET_Y: 20 // Y offset for completion sub-message
} as const;

// Color Constants
export const COLORS = {
  // Track Colors
  TRACK_OCCUPIED: '#8B4513',      // Brown for occupied tracks
  TRACK_UNOCCUPIED: '#A0522D',    // Lighter brown for unoccupied tracks
  TRACK_RAILS: '#696969',         // Gray for rail lines
  
  // Car Colors
  CAR_BORDER_NORMAL: '#000000',   // Black border for normal cars
  CAR_BORDER_DRAGGING: '#FFD700', // Gold border for dragging cars
  CAR_SHADOW: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black shadow
  CAR_DETAILS: 'white',           // White for car details
  
  // Exit Colors
  EXIT_BORDER: '#228B22',         // Forest green for exit borders
  EXIT_ARROW: 'white',            // White for exit arrows
  EXIT_DEFAULT: '#32CD32',        // Lime green for default exits
  
  // UI Colors
  BACKGROUND: '#2F4F2F',          // Dark green background
  TEXT_PRIMARY: 'white',          // White for primary text
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
  COMPLETION_SUCCESS: '#32CD32',  // Green for completion message
  COMPLETION_OVERLAY: 'rgba(0, 0, 0, 0.7)', // Dark overlay for completion
  
  // Drag Colors
  DRAG_HIGHLIGHT: 'rgba(255, 255, 0, 0.3)', // Yellow highlight for valid positions
  
  // Level-specific Colors
  RED: '#FF6B6B',
  CYAN: '#4ECDC4',
  YELLOW: '#FFE66D',
  BLUE: '#4A90E2',
  GREEN: '#7ED321',
  PURPLE: '#BD10E0',
  ORANGE: '#F5A623'
} as const;

// Physics/Animation Constants
export const PHYSICS = {
  DELTA_TIME_MULTIPLIER: 0.001,   // Multiplier for delta time calculations
  ANIMATION_SPEED: 0.5,           // Speed multiplier for animations
  CURVE_RADIUS_FACTOR: 0.7        // Factor for curve radius calculation
} as const;

// Calculation Helper Functions
export const CALC = {
  // Calculate car center offset from track position
  CAR_OFFSET_X: TRAIN_CAR.WIDTH / 2,
  CAR_OFFSET_Y: TRAIN_CAR.HEIGHT / 2,
  
  // Calculate track center
  TRACK_CENTER_X: TRACK.SIZE / 2,
  TRACK_CENTER_Y: TRACK.SIZE / 2,
  
  // Calculate exit center
  EXIT_CENTER_X: EXIT.WIDTH / 2,
  EXIT_CENTER_Y: EXIT.HEIGHT / 2
} as const;

// Validation Constants
export const VALIDATION = {
  MIN_TRACK_SIZE: 1,              // Minimum number of tracks
  MAX_TRACK_SIZE: 100,            // Maximum number of tracks
  MIN_CARS: 1,                    // Minimum number of cars
  MAX_CARS: 10,                   // Maximum number of cars
  MIN_EXITS: 1,                   // Minimum number of exits
  MAX_EXITS: 4                    // Maximum number of exits (one per side)
} as const;
