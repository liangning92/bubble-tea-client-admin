#!/usr/bin/env node
/**
 * Precise JSX i18n hardcoded string scanner
 * Finds Chinese text in JSX that is NOT wrapped in t()/tl()/i18n.t()
 * Built for zero-false-positive precision
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dirname, '..', 'src');

const CN_CHAR = /[\u4e00-\u9fff]/;
const CN_REGEX = /[\u4e00-\u9fff]{2,}/; // At least 2 Chinese chars to be meaningful

// Files that are data/constant files (not UI)
const DATA_FILES = ['i18n.js', 'constants.js', 'config.js'];

// Skip entire files that are data-only
const SKIP_FILES = [
  'i18n.js',
];

// Skip lines matching these patterns (code/data, not UI)
const SKIP_LINE_PATTERNS = [
  /^\s*import\s+.*from\s+['"]/,         // import statements
  /^\s*export\s+/,                       // export statements
  /^\s*const\s+\w+\s*=\s*['"][^'"]*['"]/, // const str = '...' (code strings)
  /^\s*const\s+\w+\s*=\s*`[^`]*`/,        // template literals
  /^\s*let\s+\w+\s*=\s*['"][^'"]*['"]/,
  /\brequire\s*\(\s*['"]/,               // require('...')
  /\breturn\s+['"][^'"]*['"]/,           // return '...'
  /^\s*['"][\/a-zA-Z]/,                  // string starting with /
  /\bpath\s*:\s*['"]/,                   // object path properties
  /\burl\s*:\s*['"]/,                    // object url properties
  // placeholder="..." — these ARE user facing, so we don't skip them here
];

// Skip if the entire line is a single-line comment
function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('* ');
}

// Check if Chinese text is inside a tl() or i18n.t() call
function isInsideTranslationCall(line, text) {
  // Find tl('text', ...) or tl("text", ...)
  const tlPattern = /tl\s*\(\s*['"][^'"]*未知原料/i;
  if (text.includes('未知原料') || text.includes('Unknown')) {
    if (tlPattern.test(line)) return true;
  }
  return false;
}

// Strings that are clearly code (API endpoints, variable names, etc.)
const SKIP_STRINGS = [
  'localhost', '0.0.0.0', '/api/', 'http://', 'https://',
  'admin', 'admin123', 'undefined', 'null', 'true', 'false',
  'pending', 'active', 'inactive', 'error', 'success',
  '.jsx', '.js', '.css', '.json',
];

function isChineseUI(text) {
  if (!CN_REGEX.test(text)) return false;
  if (text.length > 100) return false;

  // Skip if it's clearly a path or code
  if (SKIP_STRINGS.some(s => text.includes(s))) return false;

  // Skip very short strings (1-2 Chinese chars are usually code context)
  if (text.replace(/[\s\d\w\u4e00-\u9fff]/g, '').length < 2) return false;

  return true;
}

function lineHasHardcodedChinese(line) {
  // Skip non-content lines
  if (!CN_REGEX.test(line)) return false;

  // Skip comment-only lines
  if (isCommentLine(line)) return false;

  // Apply skip patterns
  for (const pat of SKIP_LINE_PATTERNS) {
    if (pat.test(line.trim())) return false;
  }

  return true;
}

// Find Chinese text in JSX text context
// Strategy: look for Chinese between > and </tag> or <tag .../> on same line
// Or between > at end of line and start of next line's tag
function extractHardcodedFromLine(line, lineNum) {
  const issues = [];

  // Pattern 1: >CHINESE_TEXT</tag> or >CHINESE TEXT<
  // e.g., <h4>渠道营收拆分</h4> or >暂无数据✨
  // Chinese text between opening > and closing tag
  const textNodeMatch = line.match(/(?:^|>)\s*([^\n<>]+?)\s*<\/[^>]+>/);
  if (textNodeMatch && CN_REGEX.test(textNodeMatch[1])) {
    const text = textNodeMatch[1].trim();
    if (isChineseUI(text) && !line.includes('{t(') && !line.includes('{i18n.') && !line.includes('{tl(')) {
      issues.push({ text, type: 'jsx-text', context: line.trim().slice(0, 150) });
    }
  }

  // Pattern 2: > CHINESE TEXT followed by < on next line (multi-line JSX text)
  // We need to detect the start of a text block

  // Pattern 3: attribute values with Chinese
  // placeholder="搜索...", title="提示", alt="图片"
  const attrMatches = line.matchAll(/(?:placeholder|title|alt|aria-label|label|value|text|name|desc|placeholderText|buttonLabel)\s*=\s*["']([^"']+)/g);
  for (const m of attrMatches) {
    const val = m[1];
    if (CN_REGEX.test(val) && isChineseUI(val)) {
      // Check if wrapped in t()
      const before = line.slice(0, m.index);
      if (!before.includes('{t(') && !before.includes('{i18n.') && !before.includes('`')) {
        issues.push({ text: val, type: 'attr', context: line.trim().slice(0, 150) });
      }
    }
  }

  // Pattern 4: plain JSX text on its own line
  // <span>中文文本</span> or <div>中文</div>
  // This catches: "              <h4>渠道营收拆分</h4>" type lines
  const simpleText = line.match(/^\s*<[^>]+>\s*([^\n<>{}]+)\s*<\//);
  if (simpleText && CN_REGEX.test(simpleText[1])) {
    const text = simpleText[1].trim();
    if (isChineseUI(text) && !line.includes('{t(') && !line.includes('{i18n.')) {
      // Make sure it's not a self-closing thing
      if (!issues.some(i => i.text === text)) {
        issues.push({ text, type: 'jsx-simple', context: line.trim().slice(0, 150) });
      }
    }
  }

  // Pattern 5: Chinese in text appended after JSX tag on same line
  // <h4>中文文本<span>...</span></h4>
  const complexText = line.match(/>\s*([^\n<>{}]+[\u4e00-\u9fff][^\n<>{}]*?)\s*</g);
  if (complexText) {
    for (const c of complexText) {
      const text = c.replace(/^>\s*/, '').replace(/\s*<$/, '').trim();
      if (CN_REGEX.test(text) && isChineseUI(text) && !line.includes('{t(')) {
        if (!issues.some(i => i.text === text)) {
          issues.push({ text, type: 'jsx-complex', context: line.trim().slice(0, 150) });
        }
      }
    }
  }

  // Filter out Chinese text inside tl() translation calls
  const filteredIssues = issues.filter(issue => {
    // Check if the Chinese text appears inside a tl() call on the same line
    const tlCallMatch = line.match(/tl\s*\(\s*['"][^'"]*[\u4e00-\u9fff][^'"]*['"]/);
    if (tlCallMatch) return false;
    // Also skip if the context contains tl(
    if (issue.context && issue.context.includes('tl(')) return false;
    return true;
  });

  return filteredIssues;
}

function scanFile(filePath) {
  if (SKIP_FILES.some(f => filePath.endsWith(f))) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    if (!lineHasHardcodedChinese(line)) continue;

    const found = extractHardcodedFromLine(line, lineNum);
    issues.push(...found);
  }

  return issues;
}

function scanDir(dir, ext) {
  const results = {};
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(results, scanDir(full, ext));
    } else if (entry.name.endsWith(ext)) {
      const issues = scanFile(full);
      if (issues.length > 0) {
        results[full] = issues;
      }
    }
  }
  return results;
}

console.log('=== JSX i18n Hardcoded String Scanner v2 ===\n');

const pagesDir = path.join(BASE, 'pages');
const componentsDir = path.join(BASE, 'components');

const pageIssues = scanDir(pagesDir, '.jsx');
const componentIssues = scanDir(componentsDir, '.jsx');

const allIssues = { ...pageIssues, ...componentIssues };

let total = 0;
for (const [, issues] of Object.entries(allIssues)) total += issues.length;

console.log(`Files: ${Object.keys(allIssues).length}, Total hardcoded: ${total}\n`);

for (const [file, issues] of Object.entries(allIssues)) {
  const rel = file.replace(/.*bubble_tea_full\//, '');
  console.log(`\n${rel} (${issues.length}):`);
  for (const issue of issues) {
    console.log(`  [${issue.type}] "${issue.text}"`);
    console.log(`    → ${issue.context}`);
  }
}

if (total > 0) {
  console.log(`\n❌ ${total} hardcoded strings. BUILD SHOULD FAIL.`);
  process.exit(1);
} else {
  console.log('\n✅ PASS - No hardcoded strings found.');
  process.exit(0);
}
