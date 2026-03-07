# CHESS-TET — CLAUDE CODE HANDOFF

## Read This First

This document is your entry point. Before writing a single line of code, read all three reference files in this repo:

- `chess_tet_core_spec_v1_3_final_reviewed.docx` — full game design spec. All rules, mechanics, scoring, speed system, and edge cases are defined here. Treat it as the source of truth.
- `chess-tet-components.jsx` — visual style reference. All cell rendering, colors, glow effects, panel layout, and screen structures are defined here. Match it precisely.
- `chess-tet-build-prompt.md` — component inventory and build requirements. Lists every component needed and what each must do.

Do not begin implementation until you have read all three.

---

## Repo Structure

After reading the reference files, your first task is to propose and create a clean repo structure before writing any game code. The structure should account for:

- A browser-based single-player-controls game (no backend, no auth, no database)
- Fast iteration and playtesting
- All tuning constants in one dedicated config file
- The three reference files staying in the root as permanent documentation

Choose the simplest tech stack that runs in the browser and supports fast rebuilds. A plain HTML/CSS/JS single file or a minimal Vite + React setup are both acceptable. Make the choice, explain it in one sentence, then create the structure.

---

## Build Phases

This project is broken into four phases. **Complete one phase per session.** At the end of every phase, write a `STATUS.md` file (instructions below) before stopping. The next session begins by reading `STATUS.md` — not this file, not the full spec.

---

### Phase 1 — Foundation
**Goal:** Repo structure exists, tech stack is running, and the board renders correctly with the right visual style.

Tasks:
1. Create repo structure
2. Install dependencies and verify dev server runs
3. Render the 10×20 shared board with correct empty cell style (dark grid, subtle cell borders)
4. Render sample placed blocks for both players using the exact cell style from `chess-tet-components.jsx` — radial gradient fill, bright neon border, inset glow, outer bleed, white highlight streak
5. Render a ghost piece (dimmed outline only, no fill)
6. Render the two player panels (left and right) with placeholder values for score, speed band, and next piece preview
7. Verify the board and panels look correct in a browser before stopping

**Phase 1 is complete when:** the game screen renders visually correctly with no game logic yet.

---

### Phase 2 — Core Game Loop
**Goal:** Two players can take alternating turns using the keyboard. Pieces fall, lock, and clear lines.

Tasks:
1. Implement the 7-tetromino bag with same sequence for both players
2. Implement piece spawning at centered top position using standard orientations
3. Implement standard controls: left/right move, rotate (SRS), soft drop, hard drop
4. Implement gravity using the Phase 3 speed bands as a config value — use S0 (800ms) for all players during Phase 2
5. Implement lock delay (~500ms, reset-limited, no stalling)
6. Implement line clear detection and resolution — clear full rows, shift board down
7. Implement strict turn alternation — only active player can control their piece, turn passes immediately after lock and line clear
8. Implement next-piece preview (one slot per player)
9. Implement opening visibility rule — Player 1's next piece hidden until Player 2 completes first placement
10. Verify both players can take turns, pieces fall and lock, lines clear correctly

**Phase 2 is complete when:** a full alternating game can be played to an arbitrary endpoint with correct line clearing.

---

### Phase 3 — Scoring, Speed, and End State
**Goal:** All game systems are implemented. A real match can be played from start to finish.

Tasks:
1. Implement ownership tracking — placed blocks remember which player placed them
2. Implement scoring engine:
   - Base clear values: Single 100 / Double 300 / Triple 500 / Tetris 800
   - Contested-cell bonus: +10 per opponent-owned cell cleared in the same event
   - Score updates immediately after each clear
3. Implement per-player speed bands driven by each player's own score:
   - S0: 0–499 → 800ms
   - S1: 500–999 → 650ms
   - S2: 1,000–1,699 → 520ms
   - S3: 1,700–2,599 → 400ms
   - S4: 2,600–3,799 → 300ms
   - S5: 3,800–5,199 → 220ms
   - S6: 5,200+ → 160ms
   - Only gravity scales. Movement, rotation, DAS, ARR stay constant.
4. Implement top-out detection:
   - Triggers if piece cannot legally spawn OR no legal placement exists
   - If locking move causes a line clear before top-out, those points count
5. Implement equal-turn resolution — when one player tops out, opponent gets one final equalizing turn
6. Implement top-out penalty: −400 applied at final score resolution only
7. Implement draw detection (equal scores after resolution)
8. Verify a full match runs correctly from start screen to end screen with correct scores

**Phase 3 is complete when:** a full match produces correct final scores, penalties, and a winner or draw.

---

### Phase 4 — Screens, Polish, and Config
**Goal:** All three screens are complete and visually match the JSX reference. All tuning values are in one config file.

Tasks:
1. Build Start Screen — title, one-line description, Start button, control reference
2. Build End Screen — both final scores, top-out penalty displayed if applied, winner declaration, Play Again button
3. Polish Game Screen to match `chess-tet-components.jsx` exactly:
   - Cell glow, gradient fill, and border brightness
   - Active player panel highlight and halo
   - Turn indicator
   - Speed bar
   - Board ambient light bleed
4. Create a single `config.js` (or equivalent) containing every tunable constant:
   - Board dimensions
   - Base clear scores
   - Contested-cell bonus
   - Top-out penalty
   - All speed band thresholds and gravity values
   - Lock delay
   - Soft drop multiplier
5. Remove all hardcoded game values from component and logic files — everything routes through config
6. Final browser test: play a complete match across all three screens

**Phase 4 is complete when:** a complete, visually polished match can be played from Start to End with all values in config.

---

## Sub-Agent Usage

Use sub-agents only within Phase 4, and only for tasks that are fully independent:
- One agent can polish the Start and End screens while another works on config extraction
- Do not split the game loop, scoring, or speed system across agents — these are interdependent and must be built sequentially

---

## STATUS.md — How to Write It

At the end of every phase, create or overwrite `STATUS.md` in the repo root with the following structure:

```
## Phase X Complete

### What was built
[Brief list of what works]

### Current file structure
[Paste the actual directory tree]

### Known issues or deferred items
[Anything that needs attention in the next phase]

### Next phase starts with
[First task of the next phase, specific enough to act on immediately]

### Config values currently in use
[List the key tuning constants and their current values]
```

The next Claude Code session will read `STATUS.md` as its first action. Make it complete enough that no other context is needed to continue.

---

## What NOT to Build

Do not add any of the following at any phase:
- Hold mechanic
- Combo or back-to-back scoring
- Garbage lines
- Items, powers, or special pieces
- Multiplayer networking
- Matchmaking or rating system
- Strategy hints, ghost move suggestions, or danger overlays
- Sound (unless trivially easy)
- More than 1 next-piece preview per player

---

## Success Criteria for the First Playable Version

- One person can play both players using the keyboard
- The shared board feels like the source of tension
- Scores update correctly including contested-cell bonuses
- Speed visibly increases as each player's score rises
- Top-out triggers correctly and the equalizing turn works
- End screen shows correct final scores with penalty applied if relevant
- All tuning constants are in one place and easy to change
