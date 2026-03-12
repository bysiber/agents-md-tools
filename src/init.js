'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const analyzer = require('./analyzer');
const { scoreFile } = require('./lint');

let chalk;
async function getChalk() {
  if (!chalk) chalk = (await import('chalk')).default;
  return chalk;
}

// ── Default template ──────────────────────────────────────────────────────────
function buildContent(a) {
  const forbidden = (a.forbidden && a.forbidden.length)
    ? a.forbidden.map(p => `- \`${p}\``).join('\n')
    : '- `dist/`\n- `node_modules/`';

  const devLine = a.dev ? `- Dev server: \`${a.dev}\`` : '';

  return `# AGENTS.md

## Project
${a.description || '[TODO: describe your project in one sentence]'}

## Commands
- Build: \`${a.build || '[TODO: add build command]'}\`
- Test:  \`${a.test  || '[TODO: add test command]'}\`
- Lint:  \`${a.lint  || '[TODO: add lint command]'}\`
${devLine ? devLine + '\n' : ''}
## Constraints
Do NOT modify:
${forbidden}

Always run the test suite before committing.

## Testing instructions
- Write tests alongside the code you change
- All tests must pass before submitting a PR

## PR instructions
- Keep PRs focused — one feature or fix per PR
- Include a brief description of what changed and why
`;
}

// ── Prompt helper ─────────────────────────────────────────────────────────────
function ask(rl, c, question, defaultVal) {
  return new Promise(resolve => {
    const hint = defaultVal ? c.gray(` (${defaultVal})`) : c.gray(' (skip)');
    rl.question(`  ${c.cyan('?')} ${question}${hint}: `, ans => {
      resolve(ans.trim() || defaultVal || '');
    });
  });
}

// ── Main init command ─────────────────────────────────────────────────────────
module.exports = async function init(opts = {}) {
  const c = await getChalk();
  const cwd = process.cwd();

  console.log(`\n  ${c.bold('agents-md init')}\n`);

  // Detect project
  const project = await analyzer.detect(cwd);
  if (project.type !== 'unknown') {
    console.log(`  Detected: ${c.cyan(project.type)} project\n`);
  }

  let answers;

  if (opts.yes) {
    // Non-interactive: use detected values + defaults
    answers = {
      description: project.description || '[TODO: describe your project]',
      build:       project.build || '[TODO: add build command]',
      test:        project.test  || '[TODO: add test command]',
      lint:        project.lint  || '[TODO: add lint command]',
      dev:         project.dev   || '',
      forbidden:   project.forbidden || [],
    };
  } else {
    // Interactive mode
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    answers = {
      description: await ask(rl, c, 'Project description', project.description),
      build:       await ask(rl, c, 'Build command',       project.build),
      test:        await ask(rl, c, 'Test command',        project.test),
      lint:        await ask(rl, c, 'Lint command',        project.lint),
      dev:         await ask(rl, c, 'Dev server command',  project.dev),
      forbidden:   project.forbidden || [],
    };
    rl.close();
    console.log();
  }

  // Build content from template
  const content = buildContent(answers);

  // Check for existing file
  const outPath = opts.output ? path.resolve(opts.output) : path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(outPath) && !opts.force) {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ok  = await new Promise(resolve => {
      rl2.question(`  ${c.yellow('!')} AGENTS.md already exists. Overwrite? [y/N] `, ans => {
        rl2.close();
        resolve(ans.trim().toLowerCase() === 'y');
      });
    });
    if (!ok) {
      console.log(`\n  ${c.yellow('Aborted.')}\n`);
      return;
    }
  }

  fs.writeFileSync(outPath, content, 'utf8');

  // Score the created file
  const { score, grade } = scoreFile(content);

  console.log(`  ${c.green('✓')} Created ${c.bold('AGENTS.md')}`);
  console.log(`  ${c.green('✓')} Score: ${c.green(`${score}/100 (${grade})`)}`);
  console.log(c.gray(`\n  Run 'agents-md lint' to see the full validation report.\n`));
};
