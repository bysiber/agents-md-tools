'use strict';

/**
 * Structure rules — 50 points total
 * These check that the file has the essential sections.
 */
module.exports = [
  {
    id:     'has-project-section',
    group:  'STRUCTURE',
    label:  '## Project section present and non-empty',
    level:  'error',
    points: 15,
    // header must exist AND be followed by at least 20 chars of non-heading content
    test:   (content) => {
      const m = content.match(/^##\s+Project\s*\n([\s\S]*?)(?=\n##|\s*$)/im);
      return m && m[1].replace(/\s+/g,'').length >= 20;
    },
    tip:    'Add a "## Project" section with a 1-2 sentence description of the codebase (min 20 chars).',
  },
  {
    id:     'has-commands-section',
    group:  'STRUCTURE',
    label:  '## Commands section present and non-empty',
    level:  'error',
    points: 15,
    test:   (content) => {
      // Split on next ## heading or end of string — avoid lazy+multiline-$ trap
      const idx = content.search(/^##\s+(Commands|Setup|Build|Getting\s+Started)/im);
      if (idx === -1) return false;
      const rest = content.slice(idx);
      const next = rest.slice(1).search(/^##\s/m); // find next heading after current
      const section = next === -1 ? rest : rest.slice(0, next + 1);
      return section.replace(/\s+/g, '').length >= 30; // heading itself is ~15 chars
    },
    tip:    'Add a "## Commands" section listing build, test, and lint commands with actual content.',
  },
  {
    id:     'has-constraints-section',
    group:  'STRUCTURE',
    label:  '## Constraints section present',
    level:  'warn',
    points: 10,
    regex:  /^##\s+(Constraints|Rules|Forbidden|Do\s+Not)/im,
    tip:    'Add a "## Constraints" section listing files/dirs the agent must not modify.',
  },
  {
    id:     'has-runnable-test-command',
    group:  'STRUCTURE',
    label:  'Test command has runnable example',
    level:  'warn',
    points: 10,
    // backtick-wrapped command that contains a test invocation
    test:   (content) =>
      /`[^`]*(pytest|npm\s+test|cargo\s+test|go\s+test|yarn\s+test|pnpm\s+test|make\s+test)[^`]*`/i.test(content) ||
      /test[:\s]+`[^`]+`/i.test(content),
    tip:    'Wrap your test command in backticks: `npm test` so agents can copy-run it.',
  },
];
