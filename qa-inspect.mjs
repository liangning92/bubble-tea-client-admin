/**
 * 页面结构检查脚本 - 深入分析员工管理页面
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
  
  // 检查员工管理页面结构
  await page.goto(`${LOCAL_URL}/staff?tab=info`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  console.log('=== 员工管理页面分析 ===');
  
  // 表格行
  const rows = await page.locator('tr').all();
  console.log(`表格行数: ${rows.length}`);
  
  // 所有按钮
  const allBtns = await page.locator('button').all();
  console.log(`\n按钮总数: ${allBtns.length}`);
  for (const btn of allBtns) {
    const txt = await btn.innerText().catch(() => '');
    const cls = await btn.getAttribute('class') || '';
    const disabled = await btn.isDisabled().catch(() => false);
    if (txt.trim()) {
      console.log(`  按钮: "${txt.trim().substring(0, 30)}" class="${cls.substring(0, 50)}" disabled=${disabled}`);
    }
  }
  
  // 所有链接/可点击元素
  const links = await page.locator('a[href], [role="button"], [onClick], [class*="clickable"], [class*="row"]').all();
  console.log(`\n可点击元素: ${links.length}`);
  for (const l of links.slice(0, 15)) {
    const txt = await l.innerText().catch(() => '');
    const tag = await l.evaluate(el => el.tagName);
    const cls = await l.getAttribute('class') || '';
    const href = await l.getAttribute('href') || '';
    if (txt.trim() || href) {
      console.log(`  ${tag}: "${txt.trim().substring(0, 30)}" href="${href.substring(0, 40)}" class="${cls.substring(0, 40)}"`);
    }
  }
  
  // 搜索编辑按钮的所有可能选择器
  console.log('\n=== 搜索编辑相关元素 ===');
  const editPatterns = [
    'button:has-text("编辑")',
    'button:has-text("Edit")',
    '[class*="edit"]',
    '[aria-label*="edit" i]',
    'td button:not(:has-text("添"))',
    'tbody button',
    'table button',
    '[class*="action"] button',
    '[class*="operate"] button',
  ];
  for (const p of editPatterns) {
    const found = await page.locator(p).all();
    if (found.length > 0) {
      console.log(`${p}: 找到 ${found.length} 个`);
      for (const f of found.slice(0, 3)) {
        const txt = await f.innerText().catch(() => '');
        const vis = await f.isVisible().catch(() => false);
        console.log(`    "${txt.trim().substring(0, 20)}" visible=${vis}`);
      }
    }
  }
  
  await browser.close();
}

inspect().catch(console.error);
