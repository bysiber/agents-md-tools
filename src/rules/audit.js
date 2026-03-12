'use strict';

/**
 * Advanced security audit rules — for `agents-md audit` command.
 * Derived from scanning 74,688 AGENTS.md files on GitHub.
 * These are SEPARATE from the basic lint security rules.
 */
module.exports = [
  {
    id:       'no-credentials-in-config',
    severity: 'CRITICAL',
    label:    'Credential patterns detected',
    test:     (content) => {
      const patterns = [
        /(?:password|passwd|pwd)\s*[:=]\s*\S+/i,
        /(?:api[_-]?key|apikey)\s*[:=]\s*\S+/i,
        /(?:secret[_-]?key|secret)\s*[:=]\s*\S+/i,
        /(?:access[_-]?token|auth[_-]?token|token)\s*[:=]\s*\S{8,}/i,
        /sk-[a-zA-Z0-9]{20,}/,                          // OpenAI keys
        /ghp_[a-zA-Z0-9]{36}/,                          // GitHub PATs
        /AKIA[0-9A-Z]{16}/,                             // AWS access keys
        /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,      // Private keys
        /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\./,  // JWTs
      ];
      const found = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const p of patterns) {
          if (p.test(lines[i])) {
            found.push({ line: i + 1, match: lines[i].trim().slice(0, 80) });
            break;
          }
        }
      }
      return found;
    },
    tip: 'Move credentials to .env and reference via environment variables.',
    data: '40,192 AGENTS.md files contain credential patterns (53% of total)',
  },
  {
    id:       'no-env-file-exposure',
    severity: 'CRITICAL',
    label:    '.env files referenced without deny-list',
    test:     (content) => {
      const found = [];
      if (/\.env\b/i.test(content)) {
        const hasDeny = /do\s+NOT.{0,80}\.env|never.{0,40}\.env|deny.{0,40}\.env|❌.{0,40}\.env/i.test(content);
        if (!hasDeny) {
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (/\.env\b/i.test(lines[i])) {
              found.push({ line: i + 1, match: lines[i].trim().slice(0, 80) });
            }
          }
        }
      }
      return found;
    },
    tip: 'Add: "Do NOT read or modify .env files" to prevent secret leakage.',
    data: '5,000+ AGENTS.md files reference .env without protection',
  },
  {
    id:       'no-unrestricted-access',
    severity: 'HIGH',
    label:    'Unrestricted file access granted',
    test:     (content) => {
      const patterns = [
        /full\s+access/i,
        /no\s+restrictions?/i,
        /all\s+files/i,
        /any\s+directory/i,
        /allowed_paths\s*[:=]\s*\[?\s*"\*"\s*\]?/i,
        /\*\*\/\*/,
      ];
      const found = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const p of patterns) {
          if (p.test(lines[i])) {
            found.push({ line: i + 1, match: lines[i].trim().slice(0, 80) });
            break;
          }
        }
      }
      return found;
    },
    tip: 'Define explicit file/directory boundaries: "Only modify: src/, tests/"',
    data: '672 files grant unrestricted access',
  },
  {
    id:       'no-destructive-commands',
    severity: 'HIGH',
    label:    'Destructive commands without warnings',
    test:     (content) => {
      const patterns = [
        /rm\s+-rf?\s/i,
        /drop\s+(?:database|table)/i,
        /docker\s+rm/i,
        /git\s+push\s+--force/i,
        /git\s+reset\s+--hard/i,
        /truncate\s+table/i,
        /format\s+c:/i,
        /mkfs\./i,
      ];
      const found = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Skip lines that already have warnings
        if (/⚠️|warning|caution|careful|dangerous/i.test(lines[i])) continue;
        for (const p of patterns) {
          if (p.test(lines[i])) {
            found.push({ line: i + 1, match: lines[i].trim().slice(0, 80) });
            break;
          }
        }
      }
      return found;
    },
    tip: 'Mark destructive commands with ⚠️ WARNING and require confirmation.',
    data: '2,080 files contain destructive commands',
  },
  {
    id:       'no-privilege-escalation',
    severity: 'HIGH',
    label:    'Privilege escalation commands',
    test:     (content) => {
      const patterns = [
        /\bsudo\b/,
        /chmod\s+777/,
        /chown\s+root/,
        /--privileged/,
        /cap[_-]add/i,
      ];
      const found = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const p of patterns) {
          if (p.test(lines[i])) {
            found.push({ line: i + 1, match: lines[i].trim().slice(0, 80) });
            break;
          }
        }
      }
      return found;
    },
    tip: 'Remove sudo commands or add: "Never run commands with elevated privileges."',
    data: '1,344 AGENTS.md files contain sudo commands',
  },
  {
    id:       'no-confirmation-bypass',
    severity: 'HIGH',
    label:    'Human confirmation bypassed',
    test:     (content) => {
      const patterns = [
        /without\s+confirmation/i,
        /execute\s+automatically/i,
        /no\s+approval\s+needed/i,
        /skip\s+(?:review|confirmation|approval)/i,
        /auto-?execute/i,
        /without\s+asking/i,
      ];
      const found = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const p of patterns) {
          if (p.test(lines[i])) {
            found.push({ line: i + 1, match: lines[i].trim().slice(0, 80) });
            break;
          }
        }
      }
      return found;
    },
    tip: 'Require human confirmation for irreversible actions.',
    data: 'Found in repos like anomalyco/opencode',
  },
  {
    id:       'require-file-boundaries',
    severity: 'MEDIUM',
    label:    'No file access boundaries defined',
    test:     (content) => {
      const hasBoundaries =
        /only\s+(modify|access|write|read|work\s+in)/i.test(content) ||
        /do\s+NOT\s+(modify|access|read|write|touch)/i.test(content) ||
        /❌\s*(deny|block|restrict)/i.test(content) ||
        /file[_-]?jail/i.test(content) ||
        /allowed[_-]?paths/i.test(content);
      return hasBoundaries ? [] : [{ line: 0, match: 'No file access boundaries found in entire file' }];
    },
    tip: 'Add: "## File Access\\n- ✅ Read/Write: src/, tests/\\n- ❌ Deny: .env, .git, secrets/"',
    data: '~70% of AGENTS.md files lack explicit boundaries',
  },
  {
    id:       'require-network-boundaries',
    severity: 'MEDIUM',
    label:    'No network access boundaries defined',
    test:     (content) => {
      const mentionsNetwork =
        /api|http|url|endpoint|fetch|request|curl|wget|docker|network/i.test(content);
      if (!mentionsNetwork) return [];

      const hasBoundaries =
        /only\s+(?:access|call|fetch|connect)/i.test(content) ||
        /❌.{0,40}(?:network|external|internet)/i.test(content) ||
        /allowed.{0,20}(?:domain|host|url|endpoint)/i.test(content);
      return hasBoundaries ? [] : [{ line: 0, match: 'Network access mentioned without boundaries' }];
    },
    tip: 'Define which domains the agent may access: "Allow: api.github.com. Deny: internal networks."',
    data: '952 files mention docker run (potential network access)',
  },
];
