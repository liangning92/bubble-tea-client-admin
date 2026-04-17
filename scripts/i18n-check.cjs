#!/usr/bin/env node
/**
 * i18n Compliance Checker v3
 * Only flags REAL user-visible hardcoded Chinese that needs fixing.
 * Skips: mock/demo data, comments, import lines, static default values.
 */
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = ['node_modules', 'dist', 'build', '.git', 'test'];
const SKIP_FILES = ['i18n.js']; // i18n source itself has Chinese values - skip

function isFalsePositive(line) {
  const trimmed = line.trim();

  // Skip single-line comments
  if (trimmed.startsWith('//')) return true;

  // Skip import/export
  if (/^\s*import\s/.test(line) || /^\s*export\s/.test(line)) return true;

  // Skip lines that are ONLY Chinese in a clear data context
  // Pattern: 'key': 'Chinese text' inside data arrays (mock data)
  // or: { name: 'Chinese', id: ... } style mock entries
  if (/{\s*[^}]*name:\s*['"][\u4e00-\u9fff]/.test(line) && /id:\s*[0-9]/.test(line)) return true;
  if (/id:\s*[0-9]+,\s*name:\s*['"][\u4e00-\u9fff]/.test(line)) return true;

  // Skip mock/demo data entries with multiple properties (clearly not UI labels)
  if (/['"][\u4e00-\u9fff]+['"]\s*,?\s*(id|status|icon|color|type|value)/.test(line)) return true;

  // Skip placeholder examples in comments: e.g. "例：珍珠奶茶"
  if (/[\u4e00-\u9fff]{2,3}\s*(例|示例|例如)/.test(line)) return true;

  // Skip Chinese inside ternary with lang check: valid multilingual pattern (needs fixing but flagged separately)
  // Actually - these ARE real violations. Don't skip.

  return false;
}

function scanFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, idx) => {
    const chineseChars = line.match(/[\u4e00-\u9fff]/g);
    if (!chineseChars) return;
    if (isFalsePositive(line)) return;

    // Skip if Chinese is inside a t() or tl() call
    if (/t\s*\(\s*['"][^'"]*[\u4e00-\u9fff]/.test(line)) return;
    if (/tl\s*\([^)]*[\u4e00-\u9fff]/.test(line)) return;

    // Skip labelZh/labelEn/labelId data pattern (valid trilingual nav data)
    if (/labelZh:\s*['"][\u4e00-\u9fff]/.test(line)) return;
    if (/labelEn:\s*['"][\u4e00-\u9fff]/.test(line)) return;
    if (/labelId:\s*['"][\u4e00-\u9fff]/.test(line)) return;

    // Skip zh:/en:/id: shorthand in data objects
    if (/\bzh:\s*['"][\u4e00-\u9fff]/.test(line)) return;
    if (/\ben:\s*['"][\u4e00-\u9fff]/.test(line)) return;
    if (/\bid:\s*['"][\u4e00-\u9fff]/.test(line)) return;

    // Skip t() with fallback: t('key') || 'Chinese fallback'
    if (/t\s*\([^)]+\)\s*\|\|\s*['"][\u4e00-\u9fff]/.test(line)) return;

    // Skip mock data arrays (zh/en/id as keys with Chinese values in data)
    if (/=\s*\[\s*\{[^}]*['"][\u4e00-\u9fff]+['"][^}]*\}/.test(line)) return;

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
    } else if (entry.isFile() && /\.jsx?$/.test(entry.name) && !SKIP_FILES.includes(entry.name)) {
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
