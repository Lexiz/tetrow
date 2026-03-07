## Phase 2 Complete

### What was built
- 7-tetromino bag generator with shared sequence for both players (`src/game/pieces.ts`)
- All 4 rotation states for every piece using standard Tetris Guideline orientations
- Full SRS wall kick tables for JLSTZ and I pieces (screen-coordinate system, y down)
- Board operations: collision detection, ghost row, move, SRS rotate, lock, line clear (`src/game/board.ts`)
- Game engine reducer with all actions: MOVE, ROTATE, SOFT_DROP, HARD_DROP, GRAVITY, LOCK (`src/game/engine.ts`)
- Strict turn alternation — only active player's input processed
- Per-player "next piece" preview queue drawn from shared bag
- Opening visibility rule — P1's next piece hidden until P2 completes first placement
- Lock delay (500ms) with reset-limited stall prevention (LOCK_RESETS_MAX)
- Top-out detection: triggers if piece can't spawn on the settled board
- Equalizing final turn: topped-out player's opponent gets one more turn
- Top-out penalty (−400) applied at final score resolution
- Draw detection
- DAS (133ms) + ARR (10ms) keyboard input with proper cleanup (`src/hooks/useInput.ts`)
- React hook wrapping the engine with gravity timer, lock timer, and input (`src/hooks/useGameEngine.ts`)
- GameScreen wired to live engine — sample board removed
- End-game overlay on GameScreen with SEE RESULTS button
- App.tsx passes real scores to EndScreen

### Current file structure
```
tetchess/
├── src/
│   ├── components/
│   │   ├── Board.tsx
│   │   ├── Cell.tsx
│   │   ├── Divider.tsx
│   │   ├── GameScreen.tsx      ← live game, wired to engine
│   │   ├── MiniPiece.tsx
│   │   ├── Panel.tsx
│   │   └── SpeedBar.tsx
│   ├── game/
│   │   ├── board.ts            ← board ops, collision, lock, clear
│   │   ├── engine.ts           ← GameState, reducer, display helpers
│   │   └── pieces.ts           ← shapes, SRS kicks, bag generator
│   ├── hooks/
│   │   ├── useGameEngine.ts    ← timer management + React binding
│   │   └── useInput.ts         ← keyboard DAS/ARR
│   ├── screens/
│   │   ├── EndScreen.tsx
│   │   └── StartScreen.tsx
│   ├── App.tsx
│   ├── config.ts
│   ├── main.tsx
│   ├── theme.ts
│   ├── types.ts
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── STATUS.md
```

### Known issues or deferred items
- Score scoring and per-player speed bands are implemented in the engine but Phase 3 should verify scoring produces correct values through a full match
- Combo and back-to-back scoring deliberately excluded per spec
- No sound

### Next phase starts with
Phase 3, Task 1: Verify scoring engine end-to-end — play a full match in the browser, confirm base clear values (100/300/500/800), opponent-cell bonus (+10/cell), top-out penalty (−400), and that speed bands visibly change as scores rise.
Then: confirm equalizing turn fires correctly when one player tops out.

### Config values currently in use
- Board: 10×20, cell size 23px
- Clear scores: 100 / 300 / 500 / 800
- Opponent-cell bonus: +10 per cell
- Top-out penalty: −400
- Speed bands S0–S6: 800 / 650 / 520 / 400 / 300 / 220 / 160 ms/cell
- Lock delay: 500ms, max resets: 15
- DAS: 133ms, ARR: 10ms
