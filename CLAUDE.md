# Project Instructions

## Git Workflow

**All changes go through feature branches and pull requests. Never push directly to `main`.**

1. Create a feature branch: `git checkout -b feature/<short-description>`
2. Make commits on the feature branch
3. Push the branch: `git push -u origin feature/<short-description>`
4. Create a PR: `gh pr create --base main`
5. After approval/review, merge: `gh pr merge --squash --delete-branch`
6. Deploy to GitHub Pages after merge: `git checkout main && git pull && npm run build && npx gh-pages -d dist`

Branch naming: `feature/`, `fix/`, `refactor/` prefixes.

## Deployment

- Live site: https://lexiz.github.io/tetchess/
- Deploy command: `npm run build && npx gh-pages -d dist`
- Always deploy after merging a PR to main

## Tech Stack

- React + TypeScript + Vite (browser build)
- Future: React Native + Expo for mobile
- Package manager: npm
- Game logic is pure TS in `src/game/` (reusable across platforms)

## Testing Controls (temporary)

Arrow keys control both players (single-person testing mode). Restore split controls (P1: arrows, P2: WASD) in `src/hooks/useInput.ts` before shipping.
