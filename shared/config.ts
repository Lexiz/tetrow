// All tunable game constants — edit here to adjust gameplay, never hardcode in components
export const CONFIG = {
  // Board dimensions
  COLS: 10,
  ROWS: 20,
  CELL_SIZE: 23,

  // Scoring — index = number of lines cleared (0=no clear, 1=single, 2=double, 3=triple, 4=tetris)
  CLEAR_SCORES: [0, 100, 300, 500, 800],
  OPPONENT_CELL_BONUS: 5,   // points per opponent-owned cell removed in a clear
  // Top-out penalty indexed by speed band (S0–S6).  Higher at slow speeds
  // (deliberate ceiling rush) and lower/zero at fast speeds (natural endgame).
  TOPOUT_PENALTIES: [800, 800, 400, 400, 200, 200, 0],

  // Speed bands S0–S6 — each player's gravity is driven by their own score
  SPEED_BANDS: [
    { label: 'S0', minScore: 0,    gravity: 800 },
    { label: 'S1', minScore: 500,  gravity: 650 },
    { label: 'S2', minScore: 1000, gravity: 520 },
    { label: 'S3', minScore: 1700, gravity: 400 },
    { label: 'S4', minScore: 2600, gravity: 300 },
    { label: 'S5', minScore: 3800, gravity: 220 },
    { label: 'S6', minScore: 5200, gravity: 160 },
  ],

  // Handling
  LOCK_DELAY: 500,     // ms before a grounded piece locks
  LOCK_RESETS_MAX: 15, // max lock-delay resets per piece (anti-stall)
  SOFT_DROP_FACTOR: 20,// gravity / factor = soft drop interval
  DAS: 133,            // delayed auto-shift (ms)
  ARR: 10,             // auto-repeat rate (ms)
};
