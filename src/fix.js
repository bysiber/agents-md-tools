'use strict';

const fs   = require('fs');
const path = require('path');

let chalk;
async function getChalk() {
  if (!chalk) chalk = (await import('chalk')).default;
  return chalk;
}

const ALL_RULES = [
  ...require('./rules/structure'),
  ...require('./rules/security'),
  ...require('./rules/quality'),
];

/**
 * Auto-fix common AGENTS.md issues.
 * Returns the fixed content and a list of fixes applied.
 */
function autoFix(content) {
  const fixes = [];
  let fixed = content;

  // Fix 1: Add ## Project if missing
  if (!/^##\s+Project/im.test(fixed)) {
    const hasH1 = /^#\s+/m.test(fixed);
    if (hasH1) {
      fixed = fixed.replace(/^(#\s+.*\n)/m, '$1\n## Project\n[TODO: describe your project in one sentence]\n');
    } else {
      fixed = '# AGENTS.md\n\n## Project\n[TODO: describe your project in one sentence]\n\n' + fixed;
    }
    fixes.push('Added ## Project section');
  }

  // Fix 2: Add ## Commands if missing
  if (!/^##\s+(Commands|Setup|Build|Getting\s+Started)/im.test(fixed)) {
    fixed += '\n## Commands\n- Build: `[TODO: add build command]`\n- Test: `[TODO: add test command]`\n- Lint: `[TODO: add lint command]`\n';
    fixes.push('Added ## Commands section');
  }

  // Fix 3: Add ## Constraints if missing
  if (!/^##\s+(Constraints|Rules|Forbidden|Do\s+Not)/im.test(fixed)) {
    fixed += '\n## Constraints\nDo NOT modify:\n- `dist/`\n- `node_modules/`\n- `.env`\n\nAlways run tests before committing.\n';
    fixes.push('Added ## Constraints section with default deny-list');
  }

  // Fix 4: Add deny-list if Constraints exists but no "Do NOT" pattern
  if (/^##\s+Constraints/im.test(fixed) && !/do\s+NOT\s+(modify|read|touch|edit|access)/i.test(fixed)) {
    fixed = fixed.replace(
      /(^##\s+Constraints.*\n)/im,
      '$1Do NOT modify:\n- `dist/`\n- `node_modules/`\n- `.env`\n\n'
    );
    fixes.push('Added deny-list to Constraints section');
  }

  // Fix 5: Replace [TODO] if we can detect values
  // (This is conservative — only replace with detected values)

  return { content: fixed, fixes };
}

module.exports = async function fix(opts = {}) {
  const c = await getChalk();

  const filePath = path.resolve(opts.file || './AGENTS.md');
  if (!fs.existsSync(filePath)) {
    console.error(c.red(`\n  ✗ ${filePath} not found.`));
    console.error(c.gray(`    Run 'agents-md init' to create one.\n`));
    process.exit(1);
  }

  const original = fs.readFileSync(filePath, 'utf8');

  // Run lint first to see current state
  const lines = original.split('\n');
  const beforeResults = ALL_RULES.map(rule => {
    let passed;
    if (typeof rule.test === 'function') passed = rule.test(original, lines);
    else passed = rule.regex.test(original);
    return { ...rule, passed };
  });
  const beforeScore = beforeResults.filter(r => r.passed).reduce((s, r) => s + r.points, 0);

  // Apply fixes
  const { content: fixed, fixes } = autoFix(original);

  if (fixes.length === 0) {
    console.log(`\n  ${c.green('✓')} No auto-fixable issues found. Score: ${beforeScore}/100\n`);
    return;
  }

  // Calculate after score
  const fixedLines = fixed.split('\n');
  const afterResults = ALL_RULES.map(rule => {
    let passed;
    if (typeof rule.test === 'function') passed = rule.test(fixed, fixedLines);
    else passed = rule.regex.test(fixed);
    return { ...rule, passed };
  });
  const afterScore = afterResults.filter(r => r.passed).reduce((s, r) => s + r.points, 0);

  if (opts.dryRun) {
    console.log(`\n  ${c.bold('agents-md fix')} ${c.yellow('(dry run)')}\n`);
    for (const f of fixes) {
      console.log(`  ${c.green('+')} ${f}`);
    }
    console.log(`\n  Score: ${beforeScore} → ${c.green(afterScore)} (+${afterScore - beforeScore})\n`);
    return;
  }

  // Write the fixed file
  fs.writeFileSync(filePath, fixed, 'utf8');

  console.log(`\n  ${c.bold('agents-md fix')}  ${c.gray(path.relative(process.cwd(), filePath))}\n`);
  for (const f of fixes) {
    console.log(`  ${c.green('+')} ${f}`);
  }
  console.log(`\n  Score: ${beforeScore} → ${c.green.bold(String(afterScore))} (+${afterScore - beforeScore})`);
  console.log(c.gray(`  File saved. Run 'agents-md lint' to see the full report.\n`));
};
