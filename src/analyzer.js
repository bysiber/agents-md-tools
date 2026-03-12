'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Detect project metadata from a directory.
 * Returns: { type, build, test, lint, dev, description, forbidden[] }
 */
async function detect(cwd = process.cwd()) {
  const result = {
    type: 'unknown', build: null, test: null,
    lint: null, dev: null, description: '', forbidden: [],
  };

  const has = (f) => fs.existsSync(path.join(cwd, f));
  const read = (f) => {
    try { return fs.readFileSync(path.join(cwd, f), 'utf8'); }
    catch { return null; }
  };

  // ── 1. Detect project type ───────────────────────────────────────────────
  if      (has('package.json'))                    result.type = 'nodejs';
  else if (has('pyproject.toml') || has('setup.py')) result.type = 'python';
  else if (has('Cargo.toml'))                       result.type = 'rust';
  else if (has('go.mod'))                           result.type = 'go';

  // ── 2. Extract commands ──────────────────────────────────────────────────
  if (result.type === 'nodejs') {
    const raw = read('package.json');
    if (raw) {
      try {
        const pkg = JSON.parse(raw);
        const s   = pkg.scripts || {};
        result.description = pkg.description || '';
        result.build = s.build  ? 'npm run build' : null;
        result.test  = s.test   ? 'npm test'       : null;
        result.lint  = s.lint   ? 'npm run lint'   : null;
        result.dev   = s.dev    ? 'npm run dev'
                     : s.start  ? 'npm start'       : null;
      } catch { /* ignore invalid JSON */ }
    }
    // Also check pnpm
    if (has('pnpm-lock.yaml')) {
      if (result.build) result.build = result.build.replace('npm run', 'pnpm');
      if (result.test)  result.test  = 'pnpm test';
      if (result.lint)  result.lint  = result.lint.replace('npm run', 'pnpm');
    }
  }

  if (result.type === 'python') {
    result.build = 'pip install -e ".[dev]"';
    result.test  = has('pytest.ini') || has('pyproject.toml') ? 'pytest' : 'python -m pytest';
    result.lint  = has('pyproject.toml') ? 'ruff check .' : 'flake8';
  }

  if (result.type === 'go') {
    result.build = 'go build ./...';
    result.test  = 'go test ./...';
    result.lint  = 'golangci-lint run';
  }

  if (result.type === 'rust') {
    result.build = 'cargo build';
    result.test  = 'cargo test';
    result.lint  = 'cargo clippy';
  }

  // ── 3. Forbidden paths from .gitignore ──────────────────────────────────
  const giRaw = read('.gitignore');
  if (giRaw) {
    const ignore = require('ignore');
    const ig = ignore();
    ig.add(giRaw);

    // Collect top-level directory entries that are ignored
    const candidates = giRaw.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('!'))
      .filter(l => l.endsWith('/') || /^[a-z_][a-z0-9_-]*\/$/.test(l))
      .slice(0, 8);

    result.forbidden = [...new Set(candidates)];
  }

  return result;
}

module.exports = { detect };
