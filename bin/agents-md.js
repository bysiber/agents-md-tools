#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name('agents-md')
  .description('Generate, lint, and manage AGENTS.md files for AI coding agents')
  .version(pkg.version);

// ── lint ─────────────────────────────────────────────────────────────────────
program
  .command('lint')
  .description('Validate and score AGENTS.md (10 rules, fully offline)')
  .option('--strict',          'exit with code 1 if score < 70')
  .option('--score-only',      'print score integer only (for shell scripts / CI)')
  .option('--format <fmt>',    'output format: text (default) | json')
  .option('--file <path>',     'path to AGENTS.md  [default: ./AGENTS.md]')
  .action(require('../src/lint'));

// ── audit ────────────────────────────────────────────────────────────────────
program
  .command('audit')
  .description('Security scan — detect credentials, destructive commands, and misconfigurations')
  .option('--strict',          'exit with code 1 if CRITICAL or HIGH issues found')
  .option('--format <fmt>',    'output format: text (default) | json')
  .option('--verbose',         'show data sources for each rule')
  .option('--file <path>',     'path to AGENTS.md  [default: ./AGENTS.md]')
  .action(require('../src/audit'));

// ── init ─────────────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Interactive wizard: create AGENTS.md from your project')
  .option('-y, --yes',          'skip prompts, use auto-detected values')
  .option('-f, --force',        'overwrite existing AGENTS.md without asking')
  .option('-t, --template <n>', 'template: default | python | typescript | go | monorepo')
  .option('-o, --output <file>','write to this path instead of ./AGENTS.md')
  .action(require('../src/init'));

// ── team (v2) ─────────────────────────────────────────────────────────────────
program
  .command('team')
  .description('Generate per-agent config files (CLAUDE.md, GEMINI.md, .cursorrules…)')
  .option('--agents <list>',   'comma-separated agents: claude-code,codex,gemini-cli,cursor,all')
  .option('--output <dir>',    'output directory  [default: ./agents]')
  .action(require('../src/team'));

// ── diff (v2) ─────────────────────────────────────────────────────────────────
program
  .command('diff [file1] [file2]')
  .description('Section-level diff between two AGENTS.md versions')
  .action(require('../src/diff'));

program.parse();
