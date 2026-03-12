'use strict';

const fs   = require('fs');
const path = require('path');

// chalk v5 is ESM-only — we lazy-load it inside an async function
let chalk;
async function getChalk() {
  if (!chalk) chalk = (await import('chalk')).default;
  return chalk;
}

// ── Gather all rules ──────────────────────────────────────────────────────────
const securityRules      = require('./rules/security');
const { detectLeaks }    = securityRules;

const ALL_RULES = [
  ...require('./rules/structure'),
  ...securityRules,          // spreads the exported array (structural rules)
  ...require('./rules/quality'),
];

// ── Score helper (also exported for init.js to call) ─────────────────────────
function runRules(content) {
  const lines = content.split('\n');
  return ALL_RULES.map(rule => {
    let passed;
    if (typeof rule.test === 'function') {
      passed = rule.test(content, lines);
    } else {
      passed = rule.regex.test(content);
    }
    return { ...rule, passed };
  });
}

function calcScore(results) {
  const score = results
    .filter(r => r.passed)
    .reduce((acc, r) => acc + r.points, 0);

  const grade =
    score >= 90 ? 'A+' :
    score >= 80 ? 'A'  :
    score >= 70 ? 'B'  :
    score >= 60 ? 'C'  : 'F';

  return { score, grade };
}

// ── Exported for init.js (synchronous score without chalk) ──────────────────
function scoreFile(content) {
  const results = runRules(content);
  return { results, ...calcScore(results) };
}

// ── Main lint command ─────────────────────────────────────────────────────────
module.exports = async function lint(opts = {}) {
  const c = await getChalk();

  const filePath = path.resolve(opts.file || './AGENTS.md');

  if (!fs.existsSync(filePath)) {
    console.error(c.red(`\n  ✗ ${filePath} not found.`));
    console.error(c.gray(`    Run 'agents-md init' to create one.\n`));
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = runRules(content);
  const { score, grade } = calcScore(results);

  // ── --score-only (CI shell scripts) ────────────────────────────────────────
  if (opts.scoreOnly) {
    process.stdout.write(String(score) + '\n');
    if (opts.strict && score < 70) process.exit(1);
    return;
  }

  // ── JSON output ─────────────────────────────────────────────────────────────
  if (opts.format === 'json') {
    const out = {
      file: filePath,
      score,
      grade,
      passed: score >= 70,
      rules: results.map(r => ({
        id:     r.id,
        group:  r.group,
        label:  r.label,
        passed: r.passed,
        points: r.passed ? r.points : 0,
        tip:    r.passed ? null : r.tip,
      })),
    };
    console.log(JSON.stringify(out, null, 2));
    if (opts.strict && score < 70) process.exit(1);
    return;
  }

  // ── Human-readable text output ───────────────────────────────────────────────
  console.log(`\n  ${c.bold('agents-md lint')}  ${c.gray(path.relative(process.cwd(), filePath))}\n`);

  const groups = ['STRUCTURE', 'SECURITY', 'QUALITY'];
  const groupPoints = { STRUCTURE: 50, SECURITY: 30, QUALITY: 20 };

  for (const group of groups) {
    const groupRules = results.filter(r => r.group === group);
    const earned     = groupRules.filter(r => r.passed).reduce((s, r) => s + r.points, 0);
    const max        = groupPoints[group];

    console.log(`  ${c.bold(group)} ${c.gray(`(${earned}/${max})`)}`);

    for (const rule of groupRules) {
      const icon  = rule.passed ? c.green('  ✓') : c.red('  ✗');
      const label = rule.label.padEnd(48);
      const pts   = rule.passed
        ? c.green(`+${rule.points} pts`)
        : c.dim('+0 pts');

      console.log(`${icon} ${label} ${pts}`);

      if (!rule.passed && rule.tip) {
        console.log(c.gray(`      → ${rule.tip}`));
      }
    }
    console.log();
  }

  // ── Credential / secret leak detection ──────────────────────────────────────
  if (detectLeaks) {
    const leaks = detectLeaks(content);
    if (leaks.length > 0) {
      console.log(`  ${c.bgRed.white.bold(' SECRET LEAK DETECTED ')}\n`);
      for (const leak of leaks) {
        console.log(`  ${c.red('⚠')} ${c.bold(leak.type)}: ${c.yellow(leak.match)}`);
        if (leak.tip) console.log(c.gray(`      → ${leak.tip}`));
      }
      console.log(c.red(`\n  ${leaks.length} potential secret(s) found — remove before committing!\n`));
    }
  }

  // ── Final score line ─────────────────────────────────────────────────────────
  const gradeColor = score >= 70 ? c.green : c.red;
  const scoreLabel = gradeColor(`${score}/100 (${grade})`);
  console.log(`  Score: ${scoreLabel}\n`);

  const failCount = results.filter(r => !r.passed && r.level === 'error').length;
  const warnCount = results.filter(r => !r.passed && r.level === 'warn').length;

  if (failCount > 0) {
    console.log(c.red(`  ${failCount} error(s) — required sections missing.`));
  }
  if (warnCount > 0) {
    console.log(c.yellow(`  ${warnCount} warning(s) — recommended improvements available.`));
  }
  if (failCount === 0 && warnCount === 0) {
    console.log(c.green('  All checks passed!'));
  }

  if (opts.strict && score < 70) {
    console.error(c.red(`\n  FAILED (--strict): score ${score} is below threshold 70\n`));
    process.exit(1);
  }

  console.log();
};

// Export scoreFile for use by init.js
module.exports.scoreFile = scoreFile;
