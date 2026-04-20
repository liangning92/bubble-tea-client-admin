#!/usr/bin/env node
import { chromium } from 'playwright';

const PAGES = [
  { name: 'DashboardTeam', url: 'http://localhost:6060/' },
  { name: 'ProductPage', url: 'http://localhost:6060/product' },
  { name: 'StaffPage', url: 'http://localhost:6060/staff' },
  { name: 'InventoryHub', url: 'http://localhost:6060/inventory' },
  { name: 'POSSettingsPage', url: 'http://localhost:6060/settings?tab=pos' },
  { name: 'PermissionMatrix', url: 'http://localhost:6060/settings?tab=rbac' },
  { name: 'Leaderboard', url: 'http://localhost:6060/leaderboard' },
  { name: 'SchedulePage', url: 'http://localhost:6060/schedule' },
  { name: 'HygieneHub', url: 'http://localhost:6060/hygiene' },
  { name: 'ProfitPage', url: 'http://localhost:6060/profit' },
  { name: 'ExpensePage', url: 'http://localhost:6060/expense' },
  { name: 'MarketingHub', url: 'http://localhost:6060/marketing' },
  { name: 'CRMHub', url: 'http://localhost:6060/crm' },
  { name: 'RewardPage', url: 'http://localhost:6060/rewards' },
  { name: 'SalesAnalysisPage', url: 'http://localhost:6060/sales' },
  { name: 'BusinessAnalysisPage', url: 'http://localhost:6060/business' },
  { name: 'StoreSettingsPage', url: 'http://localhost:6060/settings?tab=profile' },
  { name: 'TrainingPage', url: 'http://localhost:6060/training' },
  { name: 'AttendancePage', url: 'http://localhost:6060/attendance' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Login once
await page.goto('http://localhost:6060/', { waitUntil: 'networkidle' });
await page.fill('input[type="text"]', 'admin');
await page.fill('input[type="password"]', 'admin123');
await page.click('button[type="submit"]');
await page.waitForURL('**/*', { timeout: 10000 });
await page.waitForTimeout(2000);
console.log('Logged in\n');

const issues = [];

for (const p of PAGES) {
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    
    const pageText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const texts = [];
      let n;
      while (n = walker.nextNode()) {
        const t = n.textContent?.trim();
        if (t && t.length > 3 && t.length < 300) texts.push(t);
      }
      return texts;
    });
    
    // Find text that has both Chinese and English words (4+ letter English words)
    for (const txt of pageText) {
      const hasZH = /[\u4e00-\u9fff]/.test(txt);
      if (!hasZH) continue;
      
      // Split into words and find English words 4+
      const words = txt.match(/[A-Za-z]{4,}/g) || [];
      for (const w of words) {
        // Skip common allowed terms
        if (/^(The|A|An|And|Or|But|For|In|On|At|To|Is|Are|Was|Were|Will|Would|Could|Should|May|Might|Must|Have|Has|Had|Do|Does|Did|This|That|These|Those|With|From|By|Be|Been|Being|Have|Had|Has|Get|Got|Set|Let|Put|Take|Make|Come|Go|See|Look|Show|Get|Make)$/i.test(w)) continue;
        // Skip DB data patterns
        if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(w)) continue;
        if (/^(Ayam|Goreng|Plastik|Gelas|Susu|Kopi|Latte|Teh|Milk|Smoothie|Thai|Jus|seng|Tarik|Segar|Bud |Santor|Crew|Cashier|Barista)$/.test(w)) continue;
        issues.push({ page: p.name, word: w, context: txt.substring(0, 120) });
      }
    }
    console.log(`[${p.name}] scanned`);
  } catch (e) {
    console.log(`[${p.name}] ERROR: ${e.message}`);
  }
}

console.log('\n========== ENGLISH IN CHINESE UI ==========\n');
const byWord = {};
issues.forEach(i => {
  if (!byWord[i.word]) byWord[i.word] = [];
  byWord[i.word].push(i.page);
});

Object.entries(byWord).sort((a,b) => b[1].length - a[1].length).forEach(([word, pages]) => {
  console.log(`"${word}" (${pages.length} pages): ${[...new Set(pages)].join(', ')}`);
  const ctx = issues.find(i => i.word === word);
  console.log(`  → "${ctx.context}"\n`);
});

console.log(`\nTotal: ${Object.keys(byWord).length} unique English words mixed in Chinese UI`);
await browser.close();
