'use strict';

const fs   = require('fs');
const path = require('path');

let chalk;
async function getChalk() {
  if (!chalk) chalk = (await import('chalk')).default;
  return chalk;
}

const AUDIT_RULES = require('./rules/audit');

const SEVERITY_ORDER  = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
const SEVERITY_COLORS = {
  CRITICAL: (c, t) => c.bgRed.white.bold(` ${t} `),
  HIGH:     (c, t) => c.red.bold(t),
  MEDIUM:   (c, t) => c.yellow(t),
  LOW:      (c, t) => c.blue(t),
  INFO:     (c, t) => c.gray(t),
};

function runAudit(content) {
  return AUDIT_RULES.map(rule => {
    const findings = rule.test(content);
    return {
      id:       rule.id,
      severity: rule.severity,
      label:    rule.label,
      findings: findings,
      passed:   findings.length === 0,
      tip:      rule.tip,
      data:     rule.data,
    };
  }).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

module.exports = async function audit(opts = {}) {
  const c = await getChalk();

  const filePath = path.resolve(opts.file || './AGENTS.md');
  if (!fs.existsSync(filePath)) {
    console.error(c.red(`\n  ✗ ${filePath} not found.`));
    console.error(c.gray(`    Run 'agents-md init' to create one.\n`));
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = runAudit(content);

  const totalFindings = results.reduce((s, r) => s + r.findings.length, 0);
  const critical      = results.filter(r => r.severity === 'CRITICAL' && !r.passed).length;
  const high          = results.filter(r => r.severity === 'HIGH' && !r.passed).length;
  const medium        = results.filter(r => r.severity === 'MEDIUM' && !r.passed).length;

  // JSON output
  if (opts.format === 'json') {
    const out = {
      file: filePath,
      totalFindings,
      summary: { critical, high, medium },
      passed: critical === 0 && high === 0,
      rules: results.map(r => ({
        id:       r.id,
        severity: r.severity,
        label:    r.label,
        passed:   r.passed,
        findings: r.findings,
        tip:      r.passed ? null : r.tip,
      })),
    };
    console.log(JSON.stringify(out, null, 2));
    if (opts.strict && (critical > 0 || high > 0)) process.exit(1);
    return;
  }

  // Human-readable output
  console.log(`\n  ${c.bold('agents-md audit')}  ${c.gray(path.relative(process.cwd(), filePath))}`);
  console.log(`  ${c.gray('Security scan based on 74,688 AGENTS.md files analyzed')}\n`);

  for (const rule of results) {
    const colorFn = SEVERITY_COLORS[rule.severity] || ((c, t) => t);

    if (rule.passed) {
      console.log(`  ${c.green('✓')} ${colorFn(c, rule.severity.padEnd(8))} ${rule.label}`);
    } else {
      console.log(`  ${c.red('✗')} ${colorFn(c, rule.severity.padEnd(8))} ${rule.label}`);

      for (const finding of rule.findings) {
        if (finding.line > 0) {
          console.log(c.gray(`      Line ${String(finding.line).padStart(3)}: ${finding.match}`));
        } else {
          console.log(c.gray(`      ${finding.match}`));
        }
      }

      console.log(c.gray(`      → ${rule.tip}`));
      if (opts.verbose && rule.data) {
        console.log(c.gray(`      📊 ${rule.data}`));
      }
      console.log();
    }
  }

  // Summary
  console.log();
  if (totalFindings === 0) {
    console.log(`  ${c.green.bold('✓ No security issues found!')}`);
    console.log(c.gray('    Your AGENTS.md follows security best practices.\n'));
  } else {
    console.log(`  ${c.bold('Summary:')} ${totalFindings} finding(s)`);
    if (critical > 0) console.log(`    ${c.bgRed.white.bold(` ${critical} CRITICAL `)} — immediate action required`);
    if (high > 0)     console.log(`    ${c.red.bold(`${high} HIGH`)} — should fix before production`);
    if (medium > 0)   console.log(`    ${c.yellow(`${medium} MEDIUM`)} — recommended improvements`);
    console.log();
  }

  if (opts.strict && (critical > 0 || high > 0)) {
    console.error(c.red(`  FAILED (--strict): ${critical} critical, ${high} high severity issues\n`));
    process.exit(1);
  }
};
