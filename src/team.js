'use strict';

const fs   = require('fs');
const path = require('path');

let chalk;
async function getChalk() {
  if (!chalk) chalk = (await import('chalk')).default;
  return chalk;
}

const PROFILES = {
  'claude-code': {
    outputFile:  path.join('agents', 'claude-code.md'),
    symlinkFrom: 'CLAUDE.md',
    extraSection:
`## Claude Code tips
- Use the Task tool for spawning long-running sub-tasks
- Use the Bash tool for shell commands, not code block markdown
- Prefer reading small files over large ones — use Read with line ranges
`,
  },
  'codex': {
    outputFile:  path.join('agents', 'codex.md'),
    symlinkFrom: null,   // Codex reads AGENTS.md natively
    extraSection: '',
  },
  'gemini-cli': {
    outputFile:  path.join('agents', 'gemini-cli.md'),
    symlinkFrom: 'GEMINI.md',
    extraSection:
`## Gemini CLI tips
- Use --model flag to select the model tier (flash / pro)
- Use @file syntax to include file content in prompts
`,
  },
  'cursor': {
    outputFile:  '.cursorrules',
    symlinkFrom: null,
    format:      'plaintext',
    extraSection: '',
  },
  'windsurf': {
    outputFile:  '.windsurfrules',
    symlinkFrom: null,
    format:      'plaintext',
    extraSection: '',
  },
};

function stripMarkdownHeaders(md) {
  return md
    .replace(/^#{1,6}\s+/gm, '')   // remove heading markers
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .trim();
}

module.exports = async function team(opts = {}) {
  const c = await getChalk();

  const basePath = path.resolve('./AGENTS.md');
  if (!fs.existsSync(basePath)) {
    console.error(c.red(`\n  ✗ AGENTS.md not found. Run 'agents-md init' first.\n`));
    process.exit(1);
  }

  const baseContent = fs.readFileSync(basePath, 'utf8');

  const agentInput = opts.agents || '';
  const agentList  = agentInput === 'all'
    ? Object.keys(PROFILES)
    : agentInput.split(',').map(a => a.trim()).filter(Boolean);

  if (!agentList.length) {
    console.error(c.red('\n  ✗ Specify agents: --agents claude-code,codex,gemini-cli,cursor\n'));
    process.exit(1);
  }

  const outDir = opts.output || 'agents';
  if (outDir !== '.' && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n  ${c.bold('agents-md team')}\n`);

  const config = { version: '1.0', base: './AGENTS.md', agents: [] };

  for (const agentId of agentList) {
    const profile = PROFILES[agentId];
    if (!profile) {
      console.warn(c.yellow(`  ⚠ Unknown agent: ${agentId} — skipping`));
      continue;
    }

    let agentContent = baseContent;
    if (profile.extraSection) agentContent += '\n' + profile.extraSection;
    if (profile.format === 'plaintext') agentContent = stripMarkdownHeaders(agentContent);

    const outPath = path.resolve(profile.outputFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, agentContent, 'utf8');
    console.log(`  ${c.green('✓')} Created ${c.bold(profile.outputFile)}`);

    if (profile.symlinkFrom) {
      const linkPath = path.resolve(profile.symlinkFrom);
      try {
        if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
        // Use relative path for symlink so it's portable
        fs.symlinkSync(profile.outputFile, linkPath);
        console.log(`  ${c.green('✓')} ${profile.symlinkFrom} ${c.gray('→')} ${profile.outputFile} ${c.gray('(symlink)')}`);
      } catch {
        // Windows fallback: copy
        fs.copyFileSync(outPath, linkPath);
        console.log(`  ${c.yellow('✓')} ${profile.symlinkFrom} ${c.gray('(copy — symlinks unavailable)')}`);
      }
    }

    config.agents.push({ id: agentId, file: profile.outputFile });
  }

  fs.writeFileSync('.agents-config.json', JSON.stringify(config, null, 2), 'utf8');
  console.log(`  ${c.green('✓')} Created ${c.bold('.agents-config.json')}`);
  console.log(c.gray(`\n  ${config.agents.length} agent config(s) created.\n`));
};
