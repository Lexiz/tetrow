# Project Instructions

## Git Workflow

**All changes go through feature branches and pull requests. Never push directly to `main`.**

1. Create a feature branch: `git checkout -b feature/<short-description>`
2. Make commits on the feature branch
3. Push the branch: `git push -u origin feature/<short-description>`
4. Create a PR: `gh pr create --base main`
5. Merge immediately: `gh pr merge --squash --delete-branch`
6. Deploy after merge: `git checkout main && git pull && cd app && npm run build && cd .. && npx gh-pages -d app/dist`

Branch naming: `feature/`, `fix/`, `refactor/` prefixes.

## Project Structure

```
tetchess/
├── shared/              ← game logic, config, types, theme (pure TS, no React)
│   ├── game/
│   │   ├── board.ts
│   │   ├── engine.ts
│   │   └── pieces.ts
│   ├── config.ts
│   ├── types.ts
│   └── theme.ts
├── app/                 ← single Vite+React app with responsive layout
│   ├── src/
│   │   ├── monitor/     ← desktop layout components (GameScreen, Panel, Divider)
│   │   ├── mobile/      ← mobile layout components (to be built)
│   │   ├── common/      ← shared UI (Cell, Board, ScorePopup, LineClearEffect, etc.)
│   │   ├── hooks/       ← useGameEngine, useInput, useIsMobile
│   │   ├── screens/     ← StartScreen, EndScreen
│   │   ├── App.tsx      ← detects device → renders monitor or mobile layout
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── sim/                 ← balance simulation scripts
├── package.json         ← npm workspaces root
└── CLAUDE.md
```

- `useIsMobile()` hook detects screen width < 768px
- App.tsx switches between monitor and mobile component trees
- Shared game logic in `shared/`, shared UI in `app/src/common/`

## Deployment

- Live site: https://lexiz.github.io/tetchess/
- Build: `cd app && npm run build`
- Deploy: `npx gh-pages -d app/dist`

## Tech Stack

- React + TypeScript + Vite
- npm workspaces
- Game logic is pure TS in `shared/` (reusable across platforms)

## Testing Controls (temporary)

Arrow keys control both players (single-person testing mode). Restore split controls in `app/src/hooks/useInput.ts` before shipping.
