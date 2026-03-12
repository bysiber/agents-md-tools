'use strict';

const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

let chalk;
async function getChalk() {
  if (!chalk) chalk = (await import('chalk')).default;
  return chalk;
}

/**
 * Parse AGENTS.md into a map of { sectionHeading -> bodyText }
 */
function parseSections(content) {
  const sections = {};
  let currentKey = '__preamble__';
  sections[currentKey] = '';

  for (const line of content.split('\n')) {
    if (/^#{1,3} /.test(line)) {
      currentKey = line.trim();
      sections[currentKey] = '';
    } else {
      sections[currentKey] += line + '\n';
    }
  }
  // Trim each section body
  for (const k of Object.keys(sections)) {
    sections[k] = sections[k].trimEnd();
  }
  return sections;
}

function readSource(src) {
  if (/^HEAD/.test(src)) {
    try {
      return execSync(`git show ${src}`, { encoding: 'utf8' });
    } catch (e) {
      return null;
    }
  }
  if (!fs.existsSync(src)) return null;
  return fs.readFileSync(src, 'utf8');
}

module.exports = async function diff(file1, file2, opts = {}) {
  const c = await getChalk();

  // Default: compare HEAD version with current
  if (!file1) { file1 = 'HEAD:AGENTS.md'; file2 = './AGENTS.md'; }
  if (!file2) { file2 = './AGENTS.md'; }

  const raw1 = readSource(file1);
  const raw2 = readSource(file2);

  if (!raw1) {
    console.error(c.red(`\n  ✗ Could not read: ${file1}\n`));
    process.exit(1);
  }
  if (!raw2) {
    console.error(c.red(`\n  ✗ Could not read: ${file2}\n`));
    process.exit(1);
  }

  const a = parseSections(raw1);
  const b = parseSections(raw2);

  const allKeys = new Set([
    ...Object.keys(a).filter(k => k !== '__preamble__'),
    ...Object.keys(b).filter(k => k !== '__preamble__'),
  ]);

  const added     = [];
  const removed   = [];
  const changed   = [];
  const unchanged = [];

  for (const key of allKeys) {
    const inA = key in a;
    const inB = key in b;
    if      (!inA)               added.push(key);
    else if (!inB)               removed.push(key);
    else if (a[key] !== b[key])  changed.push(key);
    else                         unchanged.push(key);
  }

  const label1 = path.basename(file1);
  const label2 = path.basename(file2);
  console.log(`\n  ${c.bold('agents-md diff')}  ${c.gray(label1)} → ${c.bold(label2)}\n`);

  if (added.length) {
    console.log(c.green('  ADDED sections:'));
    added.forEach(k => console.log(c.green(`    + ${k}`)));
    console.log();
  }
  if (removed.length) {
    console.log(c.red('  REMOVED sections:'));
    removed.forEach(k => console.log(c.red(`    - ${k}`)));
    console.log();
  }
  if (changed.length) {
    console.log(c.yellow('  CHANGED sections (content modified):'));
    changed.forEach(k => console.log(c.yellow(`    ~ ${k}`)));
    console.log();
  }
  if (unchanged.length) {
    console.log(c.gray(`  UNCHANGED: ${unchanged.join(' · ')}`));
    console.log();
  }

  if (!added.length && !removed.length && !changed.length) {
    console.log(c.green('  ✓ No differences found — files are identical.\n'));
  }
};
