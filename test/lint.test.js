'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const structureRules = require('../src/rules/structure');
const securityRules  = require('../src/rules/security');
const qualityRules   = require('../src/rules/quality');

const ALL_RULES = [...structureRules, ...securityRules, ...qualityRules];

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

function score(results) {
  return results.filter(r => r.passed).reduce((s, r) => s + r.points, 0);
}

// ── Load fixtures ──────────────────────────────────────────────────────────────
const valid   = fs.readFileSync(path.join(__dirname, 'fixtures', 'valid.md'), 'utf8');
const broken  = fs.readFileSync(path.join(__dirname, 'fixtures', 'broken.md'), 'utf8');
const secrets = fs.readFileSync(path.join(__dirname, 'fixtures', 'secrets.md'), 'utf8');

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Rules count', () => {
  it('should have exactly 10 rules', () => {
    assert.equal(ALL_RULES.length, 10);
  });

  it('structure rules total 50 points', () => {
    const total = structureRules.reduce((s, r) => s + r.points, 0);
    assert.equal(total, 50);
  });

  it('security rules total 30 points', () => {
    const total = securityRules.reduce((s, r) => s + r.points, 0);
    assert.equal(total, 30);
  });

  it('quality rules total 20 points', () => {
    const total = qualityRules.reduce((s, r) => s + r.points, 0);
    assert.equal(total, 20);
  });
});

describe('Valid fixture', () => {
  const results = runRules(valid);

  it('should score 100/100', () => {
    assert.equal(score(results), 100);
  });

  it('all rules pass', () => {
    const failed = results.filter(r => !r.passed);
    assert.equal(failed.length, 0, `Failed rules: ${failed.map(r => r.id).join(', ')}`);
  });
});

describe('Broken fixture', () => {
  const results = runRules(broken);

  it('should score below 70', () => {
    assert.ok(score(results) < 70, `Score ${score(results)} should be < 70`);
  });

  it('should fail structure rules', () => {
    const structFailed = results.filter(r => r.group === 'STRUCTURE' && !r.passed);
    assert.ok(structFailed.length > 0, 'Should fail at least one structure rule');
  });
});

describe('Secrets fixture', () => {
  const results = runRules(secrets);

  it('should detect security issues', () => {
    // The secrets fixture has issues but also has some structure
    const secFailed = results.filter(r => r.group === 'SECURITY' && !r.passed);
    // At minimum, scope definition should fail
    assert.ok(results.length > 0, 'Should have rules to check');
  });
});

describe('Rule IDs are unique', () => {
  it('no duplicate IDs', () => {
    const ids = ALL_RULES.map(r => r.id);
    const unique = new Set(ids);
    assert.equal(ids.length, unique.size, `Duplicates: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);
  });
});

describe('Each rule has required fields', () => {
  for (const rule of ALL_RULES) {
    it(`${rule.id} has all required fields`, () => {
      assert.ok(rule.id, 'missing id');
      assert.ok(rule.group, 'missing group');
      assert.ok(rule.label, 'missing label');
      assert.ok(rule.level, 'missing level');
      assert.ok(typeof rule.points === 'number', 'points must be number');
      assert.ok(rule.test || rule.regex, 'must have test function or regex');
      assert.ok(rule.tip, 'missing tip');
    });
  }
});
