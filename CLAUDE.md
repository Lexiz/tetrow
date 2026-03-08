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

## Versioning

Source of truth: `shared/version.ts` → `APP_VERSION`. Follows semantic versioning.

Every PR is tagged with one of:

| Tag | Version bump | When to use |
|---|---|---|
| `fix` | PATCH (0.0.X) | Bug fixes — auth issues, layout problems, broken features |
| `polish` | PATCH (0.0.X) | Style tweaks, text changes, small UI adjustments |
| `feature` | MINOR (0.X.0) | New functionality — AI mode, new screen, leaderboard |
| `breaking` | MAJOR (X.0.0) | Fundamental changes — multiplayer launch, major redesign |
| `internal` | No bump | Repo cleanup, dev tooling, docs, refactors with no user-visible change |

Rules:
- Version bump is included **in the same PR** as the change (update `shared/version.ts`)
- Multiple changes in one PR → use the **highest** applicable tag
- MINOR resets PATCH to 0 (e.g. 0.3.2 → 0.4.0)
- MAJOR resets MINOR and PATCH (e.g. 0.4.2 → 1.0.0)
- PR title is prefixed with the tag in brackets, e.g. `[fix] Resolve auth sign-in on mobile`

## Project Structure

```
tetchess/
├── shared/              ← game logic, config, types, theme, version (pure TS, no React)
│   ├── game/
│   │   ├── ai.ts        ← AI opponent (heuristic placement evaluation)
│   │   ├── board.ts
│   │   ├── engine.ts
│   │   └── pieces.ts
│   ├── config.ts
│   ├── types.ts
│   ├── theme.ts
│   └── version.ts
├── app/                 ← single Vite+React app with responsive layout
│   ├── src/
│   │   ├── monitor/     ← desktop layout components (GameScreen, Panel, Divider)
│   │   ├── mobile/      ← mobile layout components
│   │   ├── common/      ← shared UI (Cell, Board, ScorePopup, LineClearEffect, etc.)
│   │   ├── hooks/       ← useGameEngine, useInput, useIsMobile, useAuth, useTouchInput
│   │   ├── screens/     ← LoginScreen, MainMenu, StartScreen, EndScreen
│   │   ├── firebase.ts  ← Firebase config and initialization
│   │   ├── App.tsx      ← auth gate + screen routing + device detection
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── docs/                ← reference documents (not used at runtime)
│   ├── core-spec-v1.3.docx
│   └── style-reference.jsx
├── tools/               ← dev scripts (balance simulation, etc.)
│   └── simulate.ts
├── package.json         ← npm workspaces root
└── CLAUDE.md
```

- `useIsMobile()` hook detects screen width < 768px
- App.tsx switches between monitor and mobile component trees
- Shared game logic in `shared/`, shared UI in `app/src/common/`
- Firebase Auth (Google) for login, Firestore for user data

## Deployment

- Live site: https://lexiz.github.io/tetchess/
- Build: `cd app && npm run build`
- Deploy: `npx gh-pages -d app/dist`

## Tech Stack

- React + TypeScript + Vite
- Firebase Auth + Firestore
- npm workspaces
- Game logic is pure TS in `shared/` (reusable across platforms)

## Testing Controls (temporary)

Arrow keys control both players (single-person testing mode). Restore split controls in `app/src/hooks/useInput.ts` before shipping.
