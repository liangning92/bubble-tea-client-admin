#!/usr/bin/env node
/**
 * i18n Compliance Checker v2
 * Scans JSX/JS files for hardcoded text NOT using i18n system.
 * KNOWN VALID PATTERNS (not violations):
 *   - labelZh/labelEn/labelId in nav data objects (trilingual data pattern)
 *   - tl() fallback args like: tl('中文', 'en', 'id')
 *   - console.error/warn messages
 *   - Static mock data (demo content)
 *   - Comments
 */
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = ['node_modules', 'dist', 'build', '.git', 'test'];

function isFalsePositive(line, chineseInLine) {
  // Skip comments
  if (line.trim().startsWith('//')) return true;

  // Skip import/export
  if (/^\s*import\s/.test(line) || /^\s*export\s/.test(line)) return true;

  // Skip tl() fallback pattern: tl('中文', 'en', 'id')
  if (/tl\s*\(\s*['"][\u4e00-\u9fff]+['"]\s*,/.test(line)) return true;

  // Skip labelZh/labelEn/labelId data pattern (valid trilingual nav data)
  if (/labelZh:\s*['"][\u4e00-\u9fff]/.test(line)) return true;
  if (/labelEn:\s*['"][\u4e00-\u9fff]/.test(line)) return true;
  if (/labelId:\s*['"][\u4e00-\u9fff]/.test(line)) return true;

  // Skip zh:/en:/id: property shorthand in data objects
  if (/\bzh:\s*['"][\u4e00-\u9fff]/.test(line)) return true;
  if (/\ben:\s*['"][\u4e00-\u9fff]/.test(line)) return true;
  if (/\bid:\s*['"][\u4e00-\u9fff]/.test(line)) return true;

  // Skip console.error / console.warn
  if (/console\.(error|warn|log)\s*\(/.test(line)) return true;

  // Skip return statement with t() fallback: t('key') || '中文'
  if (/t\s*\([^)]+\)\s*\|\|\s*['"][\u4e00-\u9fff]/.test(line)) return true;

  // Skip static default props / useState initial values with zh/en/id structure
  if (/=\s*\{?\s*\[\s*\{[^}]*zh:\s*['"][\u4e00-\u9fff]/.test(line)) return true;

  return false;
}

function scanFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, idx) => {
    const chineseChars = line.match(/[\u4e00-\u9fff]/g);
    if (!chineseChars) return;
    if (isFalsePositive(line, chineseChars)) return;

    // Check if Chinese is inside a t() or tl() call
    const hasTtCall = /t\s*\(\s*['"][^'"]*[\u4e00-\u9fff]/.test(line) ||
                      /tl\s*\([^)]*[\u4e00-\u9fff]/.test(line);
    if (hasTtCall) return;

    violations.push({
      line: idx + 1,
      chars: [...new Set(chineseChars)].join(''),
      snippet: line.trim().slice(0, 120)
    });
  });

  return violations;
}

function walkDir(dir) {
  const results = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (SKIP_DIRS.includes(entry.name)) continue;
    if (entry.isDirectory()) {
      Object.assign(results, walkDir(fullPath));
    } else if (entry.isFile() && /\.jsx?$/.test(entry.name)) {
      const violations = scanFile(fullPath);
      if (violations.length > 0) {
        results[fullPath] = violations;
      }
    }
  }
  return results;
}

const srcDir = path.join(__dirname, '..', 'src');
const results = walkDir(srcDir);
const srcPrefix = srcDir + '/';

if (Object.keys(results).length === 0) {
  console.log('✅ i18n compliance check passed.');
  process.exit(0);
}

const total = Object.values(results).reduce((sum, v) => sum + v.length, 0);
console.log(`❌ ${total} i18n violation(s) in ${Object.keys(results).length} file(s):\n`);
for (const [file, violations] of Object.entries(results)) {
  const rel = file.replace(srcPrefix, '');
  console.log(`  📄 ${rel}`);
  violations.slice(0, 5).forEach(v => {
    console.log(`     L${v.line}: \"${v.chars}\"`);
    console.log(`       ${v.snippet}`);
  });
  if (violations.length > 5) console.log(`     ... and ${violations.length - 5} more`);
  console.log();
}
process.exit(1);
