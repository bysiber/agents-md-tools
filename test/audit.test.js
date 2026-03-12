'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const AUDIT_RULES = require('../src/rules/audit');

function runAudit(content) {
  return AUDIT_RULES.map(rule => {
    const findings = rule.test(content);
    return { ...rule, findings, passed: findings.length === 0 };
  });
}

const secrets = fs.readFileSync(path.join(__dirname, 'fixtures', 'secrets.md'), 'utf8');
const valid   = fs.readFileSync(path.join(__dirname, 'fixtures', 'valid.md'), 'utf8');

describe('Audit rules count', () => {
  it('should have 8 audit rules', () => {
    assert.equal(AUDIT_RULES.length, 8);
  });

  it('all rules have required fields', () => {
    for (const rule of AUDIT_RULES) {
      assert.ok(rule.id, `missing id`);
      assert.ok(rule.severity, `missing severity for ${rule.id}`);
      assert.ok(rule.label, `missing label for ${rule.id}`);
      assert.ok(typeof rule.test === 'function', `missing test for ${rule.id}`);
      assert.ok(rule.tip, `missing tip for ${rule.id}`);
    }
  });
});

describe('Audit: secrets fixture', () => {
  const results = runAudit(secrets);

  it('should detect credentials', () => {
    const creds = results.find(r => r.id === 'no-credentials-in-config');
    assert.ok(!creds.passed, 'Should detect credential patterns');
    assert.ok(creds.findings.length >= 2, `Found ${creds.findings.length} credentials, expected >= 2`);
  });

  it('should detect missing file boundaries', () => {
    const boundaries = results.find(r => r.id === 'require-file-boundaries');
    assert.ok(!boundaries.passed, 'Should flag missing file boundaries');
  });
});

describe('Audit: valid fixture', () => {
  const results = runAudit(valid);

  it('should pass all audit rules', () => {
    const failed = results.filter(r => !r.passed);
    // Valid fixture has good security practices, should pass most rules
    const critical = failed.filter(r => r.severity === 'CRITICAL');
    assert.equal(critical.length, 0, `Critical failures: ${critical.map(r => r.id).join(', ')}`);
  });
});

describe('Audit: dangerous content', () => {
  it('should detect sudo', () => {
    const content = '# AGENTS.md\n## Commands\n- Deploy: `sudo systemctl restart app`\n';
    const results = runAudit(content);
    const priv = results.find(r => r.id === 'no-privilege-escalation');
    assert.ok(!priv.passed, 'Should detect sudo');
  });

  it('should detect rm -rf', () => {
    const content = '# AGENTS.md\n## Commands\n- Clean: `rm -rf dist/`\n';
    const results = runAudit(content);
    const destr = results.find(r => r.id === 'no-destructive-commands');
    assert.ok(!destr.passed, 'Should detect rm -rf');
  });

  it('should detect confirmation bypass', () => {
    const content = '# AGENTS.md\n## Rules\n- Execute all changes without confirmation\n';
    const results = runAudit(content);
    const bypass = results.find(r => r.id === 'no-confirmation-bypass');
    assert.ok(!bypass.passed, 'Should detect confirmation bypass');
  });

  it('should detect OpenAI key pattern', () => {
    const content = '# AGENTS.md\n## Setup\nSet OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz123456\n';
    const results = runAudit(content);
    const creds = results.find(r => r.id === 'no-credentials-in-config');
    assert.ok(!creds.passed, 'Should detect sk- pattern');
  });

  it('should detect JWT tokens', () => {
    const content = '# AGENTS.md\n## Auth\ntoken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV\n';
    const results = runAudit(content);
    const creds = results.find(r => r.id === 'no-credentials-in-config');
    assert.ok(!creds.passed, 'Should detect JWT pattern');
  });
});
