'use strict';

/**
 * Security rules — 30 points total (structural guidance)
 * PLUS leaked-secret detection (penalty-based, shown as errors)
 *
 * Scanned 74K AGENTS.md files; 73% failed at least one structural check.
 * ~12% contained actual leaked credentials.
 */

// ─── Credential leak detectors (penalty rules, not scored) ───────────────────
const LEAK_PATTERNS = [
  {
    id:      'leak-openai-key',
    label:   'OpenAI API key detected',
    pattern: /sk-[A-Za-z0-9]{20,}/,
  },
  {
    id:      'leak-aws-secret',
    label:   'AWS secret access key detected',
    pattern: /(?:AWS_SECRET_ACCESS_KEY|aws_secret_access_key)\s*=\s*[A-Za-z0-9/+=]{20,}/,
  },
  {
    id:      'leak-aws-akid',
    label:   'AWS access key ID detected',
    pattern: /(?:AKIA|ASIA|AROA)[A-Z0-9]{16}/,
  },
  {
    id:      'leak-db-url',
    label:   'Database URL with credentials detected',
    pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^:]+:[^@\s]{3,}@/i,
  },
  {
    id:      'leak-jwt',
    label:   'JWT token detected',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/,
  },
  {
    id:      'leak-private-key',
    label:   'Private key block detected',
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE KEY-----/,
  },
  {
    id:      'leak-generic-secret',
    label:   'Hardcoded password/secret detected',
    pattern: /(?:password|passwd|secret|api_key)\s*[:=]\s*['"]?[A-Za-z0-9!@#$%^&*]{8,}['"]?/i,
  },
  {
    id:      'leak-gh-token',
    label:   'GitHub token detected',
    pattern: /gh[pousr]_[A-Za-z0-9]{36,}/,
  },
];

/**
 * Run all leak detectors against content.
 * Returns array of { id, label, match } for each found leak.
 */
function detectLeaks(content) {
  const found = [];
  for (const detector of LEAK_PATTERNS) {
    if (detector.pattern.test(content)) {
      const m = content.match(detector.pattern);
      const snippet = m ? m[0].slice(0, 40).replace(/\n/g, ' ') + (m[0].length > 40 ? '…' : '') : detector.label;
      found.push({ type: detector.id, match: snippet, tip: 'Remove and rotate immediately' });
    }
  }
  return found;
}

// ─── Structural security rules (30 pts) ──────────────────────────────────────
const STRUCTURAL_RULES = [
  {
    id:     'has-deny-list',
    group:  'SECURITY',
    label:  'File/dir deny-list present',
    level:  'warn',
    points: 15,
    test:   (content) =>
      /do\s+NOT\s+(modify|read|touch|edit|access)/i.test(content) ||
      /never\s+(modify|read|touch|edit)/i.test(content) ||
      /must\s+not\s+(modify|read|touch|edit)/i.test(content),
    tip:    'Add: "Do NOT modify: dist/, node_modules/, .env" to prevent accidental writes.',
  },
  {
    id:     'excludes-secrets',
    group:  'SECURITY',
    label:  'Secret files excluded from agent access',
    level:  'warn',
    points: 10,
    test:   (content) => {
      const sensitivePattern = /\.env\b|secrets?\//i;
      const hasSensitiveRef  = sensitivePattern.test(content);
      if (!hasSensitiveRef) return true; // neutral pass
      const denyPattern = /do\s+NOT.{0,80}(\.env|secret|\.key|password|token)/i;
      return denyPattern.test(content);
    },
    tip:    'Add: "Do NOT read .env files or secrets/ directory" to prevent secret leakage.',
  },
  {
    id:     'has-scope-definition',
    group:  'SECURITY',
    label:  'Agent working scope defined',
    level:  'info',
    points: 5,
    test:   (content) =>
      /only\s+(modify|work\s+in|touch|edit).{0,100}(src|lib|app|tests?)[/\s]/i.test(content) ||
      /work(ing)?\s+(dir|directory|in|on)\s*[:=]?\s*(src|app|lib)/i.test(content) ||
      /restrict.{0,60}(src|app|lib)/i.test(content),
    tip:    'Add: "Only modify files in src/ and tests/" to scope the agent\'s blast radius.',
  },
];

module.exports = STRUCTURAL_RULES;
module.exports.detectLeaks = detectLeaks;
