# Project Instructions

## Git Workflow

**All changes go through feature branches and pull requests. Never push directly to `main`.**

1. Create a feature branch: `git checkout -b feature/<short-description>`
2. Make commits on the feature branch
3. Push the branch: `git push -u origin feature/<short-description>`
4. Create a PR: `gh pr create --base main`
5. Merge immediately: `gh pr merge --squash --delete-branch`
6. Deploy after merge: `git checkout main && git pull && cd browser-monitor && npm run build && npx gh-pages -d dist`

Branch naming: `feature/`, `fix/`, `refactor/` prefixes.

## Monorepo Structure

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
├── browser-monitor/     ← desktop/monitor version (React + Vite)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── browser-mobile/      ← mobile-optimized version (React + Vite)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── sim/                 ← balance simulation scripts
├── package.json         ← npm workspaces root
└── CLAUDE.md
```

- **Shared code** lives in `shared/` — both apps import from it via relative paths
- **Never duplicate** game logic into app directories
- **Each app** has its own `package.json`, `tsconfig.json`, and `vite.config.ts`

## Deployment

- Live site (monitor): https://lexiz.github.io/tetchess/
- Build: `cd browser-monitor && npm run build`
- Deploy: `npx gh-pages -d browser-monitor/dist`

## Tech Stack

- React + TypeScript + Vite (browser builds)
- npm workspaces for monorepo
- Game logic is pure TS in `shared/` (reusable across platforms)
- Future: React Native + Expo for native mobile

## Testing Controls (temporary)

Arrow keys control both players (single-person testing mode). Restore split controls (P1: arrows, P2: WASD) in `browser-monitor/src/hooks/useInput.ts` before shipping.
