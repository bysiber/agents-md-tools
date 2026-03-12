# AGENTS.md

## Project
This is a TypeScript monorepo for processing financial transactions in real-time. It uses Node.js, PostgreSQL, and Redis for caching.

## Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Start: `npm start`

## Architecture
- `src/` — main application code
- `tests/` — unit and integration tests
- `dist/` — compiled output (do not modify)

## Constraints
- Do NOT modify: dist/, node_modules/, .env, .env.local
- Only modify files in src/ and tests/
- Never commit secrets or API keys
- Run `npm test` before any PR
