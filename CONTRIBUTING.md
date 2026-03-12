# Contributing to agents-md-tools

Thank you for your interest in contributing! 🎉

## Quick Start

```bash
git clone https://github.com/bysiber/agents-md-tools.git
cd agents-md-tools
npm install
node bin/agents-md.js lint  # test against our own AGENTS.md
```

## Adding a New Rule

Rules live in `src/rules/`. Each rule file exports an array of rule objects:

```js
module.exports = [
  {
    id:     'my-rule-id',       // kebab-case, unique
    group:  'SECURITY',         // STRUCTURE | SECURITY | QUALITY
    label:  'Human description', // shown in lint output
    level:  'warn',             // error | warn | info
    points: 10,                 // max points this rule awards
    test:   (content, lines) => { /* return true if passes */ },
    // OR: regex: /pattern/im,  // shorthand for simple pattern match
    tip:    'Fix suggestion shown when rule fails.',
  },
];
```

### Steps
1. Add your rule to the appropriate file in `src/rules/`
2. Update total points in the group if needed
3. Add test fixtures in `test/fixtures/`
4. Run `node bin/agents-md.js lint --file test/fixtures/valid.md` to verify
5. Open a PR with a description of what the rule catches

## Rule Ideas We're Looking For

- Secret detection (API keys, passwords, JWTs)
- Dangerous command patterns (`rm -rf`, `DROP TABLE`)
- Privilege escalation (`sudo`, `--privileged`)
- Network access restrictions
- File system scope enforcement
- Multi-agent configuration validation

## Code Style

- CommonJS (`require`/`module.exports`) — chalk is the only ESM dep (lazy-loaded)
- No transpilation needed — runs on Node 18+
- Keep dependencies minimal — each new dep needs justification

## Reporting Issues

Please include:
- Node version (`node --version`)
- OS
- The AGENTS.md content that triggered the issue (or a minimal reproduction)
- Expected vs actual output
