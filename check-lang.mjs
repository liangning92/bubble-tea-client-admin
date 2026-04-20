import { chromium } from 'playwright';
import http from 'http';

async function get(path) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 6060, path, method: 'GET' };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', () => resolve({ status: 0, data: '' }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ status: 0, data: '' }); });
    req.end();
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const BASE = 'http://localhost:6060';
  
  // Login
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 10000 });
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const pages = [
    '/dashboard',
    '/staff?tab=info',
    '/staff?tab=schedule',
    '/staff?tab=payroll',
    '/product',
    '/inventory',
    '/pos',
    '/profit',
    '/hygiene',
    '/settings?tab=rbac',
    '/leaderboard',
    '/settings?tab=profile',
  ];
  
  for (const path of pages) {
    try {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(1500);
      const text = await page.evaluate(() => document.body?.innerText || '');
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      const chineseRe = /[\u4e00-\u9fff]/;
      const englishOnlyLines = [];
      
      for (const line of lines) {
        // Skip lines with Chinese characters
        if (chineseRe.test(line)) continue;
        // Skip short lines
        if (line.length < 4) continue;
        // Skip pure numbers/symbols
        if (/^[\d\s,.\-()%]+$/.test(line)) continue;
        // Skip technical IDs
        if (/^(id|uuid|token|session)/i.test(line)) continue;
        // Flag meaningful English-only lines (likely untranslated text)
        if (line.length >= 5 && /^[A-Za-z][A-Za-z\s\/\-\:\,\.\'\&\+\#\(\)\[\]\%\d]*$/.test(line) && !/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(line)) {
          englishOnlyLines.push(line.substring(0, 100));
        }
      }
      
      if (englishOnlyLines.length > 0) {
        console.log(`\n[PATH] ${path}`);
        englishOnlyLines.slice(0, 8).forEach(w => console.log(`  EN: ${w}`));
      } else {
        console.log(`[OK] ${path}`);
      }
    } catch(e) {
      console.log(`[ERR] ${path}: ${e.message.substring(0, 50)}`);
    }
  }
  
  await browser.close();
}

main().catch(console.error);
