<p align="center">
  <span style="font-size:80px">🔒</span>
</p>

<h1 align="center">agents-md-tools</h1>

<p align="center">
  <strong>Lint, secure, and manage <code>AGENTS.md</code> files — the open standard for AI coding agents.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agents-md-tools"><img src="https://img.shields.io/npm/v/agents-md-tools.svg?style=flat-square&color=6366f1" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/agents-md-tools"><img src="https://img.shields.io/npm/dm/agents-md-tools.svg?style=flat-square&color=10b981" alt="downloads" /></a>
  <a href="https://github.com/bysiber/agents-md-tools/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="license" /></a>
  <a href="https://github.com/bysiber/agents-md-tools/actions"><img src="https://img.shields.io/github/actions/workflow/status/bysiber/agents-md-tools/ci.yml?style=flat-square&label=CI" alt="CI" /></a>
  <a href="https://nodejs.org/en/"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg?style=flat-square" alt="node >= 18" /></a>
</p>

<p align="center">
  <code>npx agents-md lint</code> — zero install, instant results.
</p>

---

> We scanned 74,688 `AGENTS.md` files on GitHub. **73% lack basic security boundaries.** No deny-lists, no scope definitions, no secret protections. Your AI agent can read, write, and delete anything — and the instructions file is the only thing between it and your `.env`.

---

## Demo

<!-- TODO: Replace with actual asciinema recording -->
<p align="center">
  <img src="./assets/demo.gif" alt="agents-md lint demo" width="680" />
</p>

```
$ npx agents-md lint

  agents-md-tools v1.0.0

  ✓  has-project-section        +15    "## Project" heading found
  ✓  has-commands-section        +15    "## Commands" heading found
  ✗  has-constraints-section      0    Missing "## Constraints" section
  ✓  has-runnable-test-command   +10    Test command detected: `npm test`
  ✗  has-deny-list                0    No deny-list found
  ✗  excludes-secrets             0    .env referenced without deny context
  ✓  has-scope-definition        +5    Working scope: src/
  ✓  no-todo-placeholders       +10    No [TODO] markers
  ✓  commands-have-examples      +5    3 code examples found
  ✓  file-has-substance          +5    47 lines (minimum: 10)

  ──────────────────────────────────

  Score:  65/100   Grade: C
  3 issues found — run agents-md lint --fix-tips for suggestions

  🔒 Security: 1 leaked credential detected
     ✗ leak-openai-key   "sk-proj-..." found on line 23
```

## Why

[`AGENTS.md`](https://github.com/agentsmd/agents.md) is the open standard adopted by Claude Code, OpenAI Codex, Gemini CLI, and Cursor. It tells AI agents how to behave in your codebase — what to modify, what to avoid, how to test.

**The problem:** Most `AGENTS.md` files are written once and forgotten. No validation. No security review. No consistency checks. When an AI agent reads a poorly written config, it hallucinates paths, overwrites protected files, and skips tests.

**agents-md-tools** fixes this:

| Command | What it does |
|---------|-------------|
| `agents-md lint` | 10-rule security & quality audit with letter grade |
| `agents-md init` | Interactive scaffolder — detects your project, writes best-practice config |
| `agents-md team` | Splits one AGENTS.md into per-agent configs (CLAUDE.md, .cursorrules, etc.) |
| `agents-md diff` | Section-level diff between two versions |

## Install

```bash
# Zero-install — run directly
npx agents-md lint

# Global install
npm install -g agents-md-tools

# Project dev dependency (for CI)
npm install --save-dev agents-md-tools
```

**Requirements:** Node.js ≥ 18. No API keys. No network calls. 100% offline.

## Commands

### `agents-md lint`

Validate your `AGENTS.md` against 10 rules across three categories: **Structure** (50 pts), **Security** (30 pts), and **Quality** (20 pts). Plus leaked-credential detection as a bonus penalty layer.

```bash
# Basic lint
agents-md lint

# Lint a specific file
agents-md lint --file ./docs/AGENTS.md

# Strict mode — exit code 1 if score < 70 (perfect for CI)
agents-md lint --strict

# Machine-readable output
agents-md lint --format json

# Just the score (for shell scripts)
agents-md lint --score-only
# → 65
```

**CI one-liner:**
```bash
npx agents-md lint --strict || exit 1
```

#### Grading Scale

| Score | Grade | Meaning |
|-------|-------|---------|
| 90–100 | **A+** | Excellent — production-ready agent config |
| 80–89 | **A** | Great — minor improvements possible |
| 70–79 | **B** | Good — some gaps in security or structure |
| 60–69 | **C** | Fair — missing important sections |
| < 60 | **F** | Failing — agent will likely misbehave |

---

### `agents-md audit`

Deep security scan — detect credentials, destructive commands, and dangerous misconfigurations. Derived from scanning 74,688 real AGENTS.md files on GitHub.

```bash
# Basic audit
agents-md audit

# Strict mode — exit code 1 if CRITICAL or HIGH issues found
agents-md audit --strict

# Verbose — show data sources for each rule
agents-md audit --verbose

# JSON output
agents-md audit --format json
```

**8 security rules:**

| Severity | Rule | Detects |
|----------|------|---------|
| 🔴 CRITICAL | `no-credentials-in-config` | API keys, passwords, JWTs, private keys |
| 🔴 CRITICAL | `no-env-file-exposure` | .env referenced without deny-list |
| 🟡 HIGH | `no-unrestricted-access` | "full access", "no restrictions" grants |
| 🟡 HIGH | `no-destructive-commands` | `rm -rf`, `DROP TABLE` without warnings |
| 🟡 HIGH | `no-privilege-escalation` | `sudo`, `chmod 777`, `--privileged` |
| 🟡 HIGH | `no-confirmation-bypass` | "execute without confirmation" patterns |
| ⚠️ MEDIUM | `require-file-boundaries` | Missing allow/deny file access lists |
| ⚠️ MEDIUM | `require-network-boundaries` | Network access without scoping |

**CI one-liner:**
```bash
npx agents-md audit --strict || exit 1
```

---

### `agents-md init`

Interactive wizard that detects your project type and generates a best-practice `AGENTS.md`.

```bash
# Interactive mode
agents-md init

# Auto-detect everything, no prompts
agents-md init --yes

# Force overwrite existing file
agents-md init --force

# Use a specific template
agents-md init --template typescript
```

**Auto-detection:** Reads `package.json`, `pyproject.toml`, `go.mod`, `Makefile`, `Cargo.toml`, and `.gitignore` to pre-fill your project description, build/test/lint commands, and file structure. The generated file is immediately scored with `lint`.

**Templates:** `default` · `typescript` · `python` · `go` · `monorepo`

---

### `agents-md team`

Split one `AGENTS.md` into per-agent config files. Each AI coding tool has its own format — this command handles the translation.

```bash
# Generate configs for all supported agents
agents-md team --agents all

# Only Claude Code and Cursor
agents-md team --agents claude-code,cursor

# Custom output directory
agents-md team --output ./config/agents
```

**Output:**
```
agents/
├── claude-code.md      → symlinked as CLAUDE.md
├── codex.md            → OpenAI Codex format
├── gemini-cli.md       → symlinked as GEMINI.md
├── cursor.md           → .cursorrules format
└── .agents-config.json → machine-readable index
```

Creates symlinks automatically (`CLAUDE.md → agents/claude-code.md`). Falls back to file copy on Windows.

---

### `agents-md diff`

Section-level diffing — not line-level noise, but meaningful structural changes.

```bash
# Compare two files
agents-md diff AGENTS.md AGENTS.md.bak

# Compare with last git commit
agents-md diff HEAD
```

```diff
  ADDED    ## Constraints        (+12 lines)
  CHANGED  ## Commands           (3 lines modified)
  REMOVED  ## Old Deploy Section (-8 lines)
  ──       ## Project            (unchanged)
```

---

## The 10 Rules

### Structure (50 points)

| ID | Rule | Points | What it checks |
|----|------|--------|----------------|
| S1 | `has-project-section` | 15 | `## Project` heading exists — agents need context |
| S2 | `has-commands-section` | 15 | `## Commands` or `## Setup` heading exists — agents need runnable tasks |
| S3 | `has-constraints-section` | 10 | `## Constraints` heading exists — agents need boundaries |
| S4 | `has-runnable-test-command` | 10 | At least one backtick-wrapped test command — agents must verify their work |

### Security (30 points)

| ID | Rule | Points | What it checks |
|----|------|--------|----------------|
| SEC1 | `has-deny-list` | 15 | "Do NOT modify/read/touch" pattern present — **#1 most common gap** |
| SEC2 | `excludes-secrets` | 10 | `.env` / `secrets/` referenced in deny context, not just mentioned |
| SEC3 | `has-scope-definition` | 5 | Agent working directories explicitly defined |

### Quality (20 points)

| ID | Rule | Points | What it checks |
|----|------|--------|----------------|
| Q1 | `no-todo-placeholders` | 10 | No `[TODO]` markers — agents follow instructions literally |
| Q2 | `commands-have-examples` | 5 | ≥ 2 backtick-wrapped commands — agents need copy-pasteable commands |
| Q3 | `file-has-substance` | 5 | ≥ 10 non-empty lines — one-liners don't help anyone |

### Leaked Credential Detection (bonus)

On top of the 10 structural rules, `lint` scans for **8 credential leak patterns** and flags them as critical errors:

| Pattern | What it catches |
|---------|----------------|
| `leak-openai-key` | `sk-proj-...` or `sk-...` OpenAI keys |
| `leak-aws-secret` | AWS secret access keys |
| `leak-aws-akid` | AWS access key IDs (`AKIA...`) |
| `leak-db-url` | Database URLs with embedded passwords |
| `leak-jwt` | JWT tokens (`eyJ...`) |
| `leak-private-key` | `-----BEGIN PRIVATE KEY-----` blocks |
| `leak-generic-secret` | Hardcoded `password=`, `secret=`, `api_key=` values |
| `leak-gh-token` | GitHub tokens (`ghp_...`, `gho_...`) |

These don't affect your score — they produce **red critical warnings** because leaked credentials in an `AGENTS.md` file mean every AI tool (and every developer who clones the repo) gets your keys.

---

## GitHub Actions

Add this to `.github/workflows/agents-md.yml`:

```yaml
name: AGENTS.md Lint
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npx agents-md lint --strict
```

That's it. PRs that degrade your `AGENTS.md` below 70/100 will fail CI.

---

## Works With

**agents-md-tools** is format-agnostic. It works with the `AGENTS.md` standard and any derivative:

| Tool | Config File | Supported |
|------|-------------|-----------|
| [Claude Code](https://docs.anthropic.com/claude-code) | `CLAUDE.md` / `AGENTS.md` | ✅ `lint --file CLAUDE.md` |
| [OpenAI Codex](https://openai.com/codex) | `AGENTS.md` | ✅ Native |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `GEMINI.md` / `AGENTS.md` | ✅ `lint --file GEMINI.md` |
| [Cursor](https://cursor.com) | `.cursorrules` | ✅ via `team` command |
| [Windsurf](https://codeium.com/windsurf) | `.windsurfrules` | ✅ via `team` command |
| [microsoft/apm](https://github.com/microsoft/apm) | `AGENTS.md` (compiled) | ✅ `apm compile → agents-md lint` |

**Pipeline with APM:**
```bash
# APM manages packages, we manage quality
apm compile          # → generates AGENTS.md from packages
agents-md lint       # → validates the result
agents-md lint --strict && git add AGENTS.md
```

---

## Comparison

| Feature | **agents-md-tools** | [agnix](https://github.com/agent-sh/agnix) | [GenerateAgents.md](https://github.com/NXSkara/GenerateAgents.md) | [roast-my-agents-md](https://github.com/vltansky/roast-my-agents-md) | [microsoft/apm](https://github.com/microsoft/apm) |
|---------|:-------------------:|:-----:|:---:|:---:|:---:|
| **Security audit** | ✅ 3 rules + 8 leak detectors | ❌ | ❌ | ❌ | ❌ |
| **Structural lint** | ✅ 10 rules, scored | ⚠️ format only | ❌ | ⚠️ LLM-based | ❌ |
| **Init / scaffold** | ✅ auto-detect, 5 templates | ❌ | ✅ LLM-generated | ❌ | ✅ `apm init` |
| **Multi-agent split** | ✅ `team` command | ❌ | ❌ | ❌ | ❌ |
| **Section diff** | ✅ `diff` command | ❌ | ❌ | ❌ | ❌ |
| **CI integration** | ✅ `--strict` exit code | ❌ | ❌ | ❌ | ❌ |
| **JSON output** | ✅ `--format json` | ❌ | ❌ | ❌ | ✅ |
| **Offline** | ✅ No API key needed | ✅ | ❌ Needs OpenAI key | ❌ Needs LLM API | ✅ |
| **Zero-install** | ✅ `npx` | ❌ Rust binary | ❌ `pip install` | ❌ Web app | ❌ `pip install` |
| **Language** | TypeScript/Node.js | Rust | Python | TypeScript | Python |
| **Credential detection** | ✅ 8 patterns | ❌ | ❌ | ❌ | ❌ |

---

## What a Good AGENTS.md Looks Like

Here's an `AGENTS.md` that scores **100/100 A+**:

```markdown
## Project

E-commerce API built with Node.js 20, Express 4, PostgreSQL 16.
Monorepo managed with Turborepo.

## Commands

- Build: `npm run build`
- Test: `npm test` (runs Jest with coverage)
- Lint: `npm run lint` (ESLint + Prettier)
- Dev: `npm run dev` (nodemon, port 3000)

## Constraints

- Do NOT modify: `dist/`, `node_modules/`, `.env`, `migrations/`, `package-lock.json`
- Do NOT read: `.env`, `secrets/`, `*.pem`, `*.key`
- Only modify files in: `src/`, `tests/`, `docs/`
- Always run `npm test` after changes
- Never commit directly to `main`

## Architecture

- `src/routes/` — Express route handlers
- `src/services/` — Business logic
- `src/models/` — Sequelize models
- `tests/` — Jest test files (mirror src/ structure)
```

---

## Roadmap

- [x] **v1.0** — `lint` (10 rules + leak detection) + `init` (5 templates)
- [x] **v1.1** — `team` (multi-agent split) + `diff` (section-level)
- [ ] **v1.2** — Plugin system (custom rules via `.agents-md-tools.config.js`)
- [ ] **v1.3** — `agents-md stats` — aggregate scoring across monorepo
- [ ] **v1.4** — `agents-md check-compat` — IDE compatibility matrix
- [ ] **v1.5** — `agents-md convert` — translate between AGENTS.md / .cursorrules / .windsurfrules
- [ ] **v2.0** — VS Code extension + GitHub App (auto-comment on PRs)

---

## Contributing

Contributions are welcome! Here's how to get started:

```bash
# Clone the repo
git clone https://github.com/bysiber/agents-md-tools.git
cd agents-md-tools

# Install dependencies
npm install

# Run tests
npm test

# Try it locally
node bin/agents-md.js lint --file test-agents.md
```

### Adding a New Rule

1. Choose a category: `src/rules/structure.js`, `security.js`, or `quality.js`
2. Add a rule object:

```js
{
  id:     'my-new-rule',
  group:  'QUALITY',
  label:  'Description of what it checks',
  level:  'warn',     // 'warn' or 'info'
  points: 10,         // max points awarded
  test:   (content) => /your-regex/.test(content),
  tip:    'Actionable fix suggestion shown to the user.',
}
```

3. Run `npm test` to verify
4. Submit a PR — we review within 24h

### Project Structure

```
agents-md-tools/
├── bin/agents-md.js          CLI entry point (commander setup)
├── src/
│   ├── lint.js               lint command handler
│   ├── init.js               init command handler
│   ├── team.js               team command handler
│   ├── diff.js               diff command handler
│   ├── analyzer.js           project type detection
│   ├── template.js           AGENTS.md template engine
│   ├── utils.js              shared helpers
│   └── rules/
│       ├── structure.js      4 rules, 50 pts
│       ├── security.js       3 rules + 8 leak detectors, 30 pts
│       └── quality.js        3 rules, 20 pts
└── templates/
    ├── default.md
    ├── typescript.md
    ├── python.md
    ├── go.md
    └── monorepo.md
```

---

## FAQ

<details>
<summary><strong>How is this different from just writing a good AGENTS.md by hand?</strong></summary>

You can! But teams of 5+ developers rarely maintain it consistently. `agents-md lint --strict` in CI ensures quality doesn't regress — same way ESLint catches issues your team "already knows about."
</details>

<details>
<summary><strong>Does this send my code or AGENTS.md to any server?</strong></summary>

No. Zero network calls. Everything runs locally with regex-based rules. No LLM, no API key, no telemetry. Verify it yourself — the source is ~800 lines of readable JavaScript.
</details>

<details>
<summary><strong>Why not use an LLM to lint AGENTS.md?</strong></summary>

LLM-based tools (like roast-my-agents-md) are slow, expensive, non-deterministic, and require API keys. A CI check that costs $0.03 per run and gives different results each time isn't a CI check. Our rules are deterministic, instant, and free.
</details>

<details>
<summary><strong>My project uses CLAUDE.md / .cursorrules, not AGENTS.md</strong></summary>

Use `--file` to point to any file: `agents-md lint --file CLAUDE.md`. The rules are format-agnostic — they check for structural patterns, not file names. Use `agents-md team` to generate tool-specific configs from a single source.
</details>

<details>
<summary><strong>What Node.js versions are supported?</strong></summary>

Node.js 18+. We use no native modules — just `commander`, `chalk`, `glob`, `ignore`, and `yaml`. Total install footprint: ~30KB.
</details>

---

## Star History

<!-- TODO: Replace with actual star-history chart after launch -->
<p align="center">
  <a href="https://star-history.com/#user/agents-md-tools&Date">
    <img src="https://api.star-history.com/svg?repos=user/agents-md-tools&type=Date" alt="Star History Chart" width="600" />
  </a>
</p>

---

## License

[MIT](./LICENSE) © 2026

---

<p align="center">
  <sub>Built because AI agents deserve better instructions — and your codebase deserves protection.</sub>
</p>
