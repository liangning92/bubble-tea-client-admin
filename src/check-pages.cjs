const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:6060/', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Check Leaderboard
  await page.goto('http://localhost:6060/leaderboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('=== LEADERBOARD ===');
  const lbText = await page.evaluate(() => document.body.innerText);
  const lbLines = lbText.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 200);
  lbLines.slice(0, 30).forEach(l => console.log(l));

  // Check Dashboard
  await page.goto('http://localhost:6060/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('\n=== DASHBOARD ===');
  const dbText = await page.evaluate(() => document.body.innerText);
  const dbLines = dbText.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 200);
  dbLines.slice(0, 30).forEach(l => console.log(l));

  // Check ProfitPage
  await page.goto('http://localhost:6060/profit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('\n=== PROFIT ===');
  const pfText = await page.evaluate(() => document.body.innerText);
  const pfLines = pfText.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 200);
  pfLines.slice(0, 20).forEach(l => console.log(l));

  // Check StaffPage
  await page.goto('http://localhost:6060/staff', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('\n=== STAFF ===');
  const stText = await page.evaluate(() => document.body.innerText);
  const stLines = stText.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 200);
  stLines.slice(0, 20).forEach(l => console.log(l));

  await browser.close();
})();
