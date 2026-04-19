/**
 * 页面结构检查脚本 - 检查更多页面
 */
import { chromium } from 'playwright';

const LOCAL_URL = 'http://localhost:6060';

async function inspect() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // 登录
  await page.goto(`${LOCAL_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
  const inputs = await page.locator('input').all();
  for (const inp of inputs) {
    const ph = await inp.getAttribute('placeholder') || '';
    if (ph.toLowerCase().includes('admin') || ph.toLowerCase().includes('user')) await inp.fill('admin');
    if (ph.toLowerCase().includes('pass')) await inp.fill('admin123');
  }
  await page.locator('button:has-text("登录"), button:has-text("Sign"), button:has-text("Login")').first().click().catch(() => {});
  await page.waitForTimeout(3000);
  
  // 检查几个页面
  const pages = [
    '/inventory',
    '/product',
    '/settings?tab=posCategories',
    '/settings?tab=rbac',
    '/settings?tab=profile',
  ];
  
  for (const p of pages) {
    console.log(`\n=== ${p} ===`);
    await page.goto(`${LOCAL_URL}${p}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // 表格行
    const rows = await page.locator('tbody tr, table tr').all();
    console.log(`表格行数: ${rows.length}`);
    
    // 查找编辑相关按钮
    const editBtns = await page.locator('button:has-text("编辑"), button:has-text("Edit"), [class*="edit"]').all();
    console.log(`编辑相关按钮: ${editBtns.length}`);
    for (const btn of editBtns) {
      const txt = await btn.innerText().catch(() => '');
      const vis = await btn.isVisible().catch(() => false);
      console.log(`  "${txt.trim().substring(0, 30)}" visible=${vis}`);
    }
    
    // 表格内所有按钮
    const tableBtns = await page.locator('tbody button, table button').all();
    console.log(`表格内按钮: ${tableBtns.length}`);
    for (const btn of tableBtns.slice(0, 5)) {
      const txt = await btn.innerText().catch(() => '');
      const cls = await btn.getAttribute('class') || '';
      console.log(`  "${txt.trim().substring(0, 20)}" class="${cls.substring(0, 40)}"`);
    }
  }
  
  await browser.close();
}

inspect().catch(console.error);
