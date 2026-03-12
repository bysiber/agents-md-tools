'use strict';

/**
 * Quality rules — 20 points total
 */
module.exports = [
  {
    id:     'no-todo-placeholders',
    group:  'QUALITY',
    label:  'No [TODO] placeholders remaining',
    level:  'warn',
    points: 10,
    test:   (content) => !content.includes('[TODO'),
    tip:    'Fill in all [TODO] placeholders — agents will follow empty instructions literally.',
  },
  {
    id:     'commands-have-examples',
    group:  'QUALITY',
    label:  'Commands section has runnable examples',
    level:  'info',
    points: 5,
    test:   (content) => {
      const inlineCode = content.match(/`[^`]{3,60}`/g) || [];
      const fencedBlock = /```[\s\S]{10,}```/.test(content);
      return inlineCode.length >= 2 || fencedBlock;
    },
    tip:    'Wrap commands in backticks so agents can copy-paste them: `npm run build`',
  },
  {
    id:     'file-has-substance',
    group:  'QUALITY',
    label:  'File has sufficient content (≥ 10 non-empty lines)',
    level:  'info',
    points: 5,
    test:   (content) => {
      const nonEmpty = content.split('\n').filter(l => l.trim().length > 0);
      return nonEmpty.length >= 10;
    },
    tip:    'A minimal AGENTS.md helps no one. Add project context, commands, and constraints.',
  },
];
