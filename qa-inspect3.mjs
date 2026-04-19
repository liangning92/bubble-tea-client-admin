/**
 * 深入检查编辑交互
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
  
  // 检查库存页面 - 找所有可点击的td
  console.log('=== /inventory 深入分析 ===');
  await page.goto(`${LOCAL_URL}/inventory`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const tds = await page.locator('tbody td').all();
  console.log(`TD数量: ${tds.length} (应该约=行数*列数)`);
  
  // 找第一行可点击元素
  const firstRowTds = await page.locator('tbody tr:first-child td').all();
  console.log(`第一行TD数: ${firstRowTds.length}`);
  for (const td of firstRowTds) {
    const txt = await td.innerText().catch(() => '');
    const cls = await td.getAttribute('class') || '';
    const onClick = await td.getAttribute('onclick') || '';
    const role = await td.getAttribute('role') || '';
    console.log(`  TD: "${txt.substring(0, 15)}" class="${cls.substring(0, 30)}" onclick="${onClick.substring(0, 20)}" role="${role}"`);
  }
  
  // 点击第一行看是否打开编辑
  if (firstRowTds.length > 0) {
    console.log('\n点击第一行...');
    await firstRowTds[0].click();
    await page.waitForTimeout(2000);
    
    // 检查是否打开弹窗
    const modal = await page.locator('[role="dialog"], .ant-modal, [class*="modal"]').first().isVisible().catch(() => false);
    console.log(`弹窗打开: ${modal}`);
    
    const inputs2 = await page.locator('input:not([type="hidden"])').all();
    const selects = await page.locator('select').all();
    console.log(`弹窗内 inputs=${inputs2.length}, selects=${selects.length}`);
  }
  
  // 检查产品页面
  console.log('\n=== /product 深入分析 ===');
  await page.goto(`${LOCAL_URL}/product`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // 产品行是可点击的吗？
  const productRows = await page.locator('tbody tr').all();
  console.log(`产品行数: ${productRows.length}`);
  
  if (productRows.length > 0) {
    const firstProdRow = productRows[0];
    const rowClass = await firstProdRow.getAttribute('class') || '';
    console.log(`第一行class: "${rowClass}"`);
    
    // 尝试点击整行
    await firstProdRow.click();
    await page.waitForTimeout(2000);
    
    const modal2 = await page.locator('[role="dialog"], .ant-modal, [class*="modal"]').first().isVisible().catch(() => false);
    console.log(`点击行后弹窗打开: ${modal2}`);
  }
  
  // RBAC页面检查
  console.log('\n=== /settings?tab=rbac 深入分析 ===');
  await page.goto(`${LOCAL_URL}/settings?tab=rbac`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const rbacRows = await page.locator('tbody tr').all();
  console.log(`RBAC行数: ${rbacRows.length}`);
  
  // 检查是否有操作按钮（可能在最后一列之外）
  const allBtns = await page.locator('tbody button, [class*="action"] button').all();
  console.log(`RBAC操作按钮: ${allBtns.length}`);
  for (const btn of allBtns) {
    const txt = await btn.innerText().catch(() => '');
    console.log(`  "${txt.trim().substring(0, 20)}"`);
  }
  
  await browser.close();
}

inspect().catch(console.error);
