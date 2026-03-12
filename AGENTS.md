# AGENTS.md

## Project
agents-md-tools — A CLI that lints, secures, and manages AGENTS.md files for AI coding agents. Think "ESLint for AGENTS.md."

## Commands
- Install: `npm install`
- Test: `npm test`
- Run lint: `node bin/agents-md.js lint`
- Run init: `node bin/agents-md.js init`
- Dev: `node bin/agents-md.js lint --file test/fixtures/valid.md`

## Constraints
Do NOT modify:
- `node_modules/`
- `dist/`
- `package-lock.json` (auto-generated)
- `.env` files

Do NOT read `.env` files or any `secrets/` directory.

Only modify files in `src/` and `test/`.

## Testing instructions
- Write tests alongside the code you change
- All tests must pass before submitting a PR
- Test with both valid and broken fixtures in `test/fixtures/`

## PR instructions
- Keep PRs focused — one feature or fix per PR
- Include a brief description of what changed and why
- Run `agents-md lint` on the project's own AGENTS.md before submitting
