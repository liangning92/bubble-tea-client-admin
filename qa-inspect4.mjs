/**
 * 检查POS分类编辑弹窗
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
  
  // 检查POS分类
  console.log('=== /settings?tab=posCategories 编辑测试 ===');
  await page.goto(`${LOCAL_URL}/settings?tab=posCategories`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // 截图
  await page.screenshot({ path: '/tmp/pos-cat-before.png' });
  
  // 找编辑按钮
  const editBtn = page.locator('button:has-text("编辑")').first();
  const btnTxt = await editBtn.innerText().catch(() => '');
  console.log(`点击按钮: "${btnTxt}"`);
  
  await editBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/pos-cat-after-click.png' });
  
  // 检查弹窗
  const dialogs = await page.locator('[role="dialog"], .ant-modal, [class*="drawer"], [class*="modal"]').all();
  console.log(`找到对话框: ${dialogs.length}`);
  
  for (const d of dialogs) {
    const vis = await d.isVisible().catch(() => false);
    const cls = await d.getAttribute('class') || '';
    const role = await d.getAttribute('role') || '';
    console.log(`  class="${cls.substring(0, 50)}" role="${role}" visible=${vis}`);
  }
  
  // 弹窗内元素
  const inputs2 = await page.locator('[role="dialog"] input, .ant-modal input, [class*="modal"] input').all();
  const selects2 = await page.locator('[role="dialog"] select, .ant-modal select, [class*="modal"] select').all();
  console.log(`弹窗内 inputs=${inputs2.length}, selects=${selects2.length}`);
  
  for (const inp of inputs2) {
    const ph = await inp.getAttribute('placeholder') || '';
    const dis = await inp.isDisabled().catch(() => false);
    console.log(`  input: placeholder="${ph}" disabled=${dis}`);
  }
  
  for (const sel of selects2) {
    const dis = await sel.isDisabled().catch(() => false);
    console.log(`  select: disabled=${dis}`);
  }
  
  // 继续检查其他有问题页面
  console.log('\n=== /staff?tab=attendance 考勤审计 ===');
  await page.goto(`${LOCAL_URL}/staff?tab=attendance`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // 找👁️按钮
  const viewBtn = page.locator('button:has-text("👁️")').first();
  const viewBtnExists = await viewBtn.isVisible().catch(() => false);
  console.log(`👁️按钮可见: ${viewBtnExists}`);
  
  if (viewBtnExists) {
    await viewBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/attendance-after-click.png' });
    
    const dialogs2 = await page.locator('[role="dialog"], .ant-modal, [class*="drawer"], [class*="modal"]').all();
    console.log(`弹窗数: ${dialogs2.length}`);
  }
  
  // 检查settings?tab=profile (商户配置)
  console.log('\n=== /settings?tab=profile 商户配置 ===');
  await page.goto(`${LOCAL_URL}/settings?tab=profile`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/profile-before.png' });
  
  const profileInputs = await page.locator('input').all();
  const profileSelects = await page.locator('select').all();
  const profileBtns = await page.locator('button').all();
  console.log(`inputs=${profileInputs.length}, selects=${profileSelects.length}, buttons=${profileBtns.length}`);
  
  // 这是单页表单，不是列表
  const editLink = page.locator('a:has-text("编辑"), [role="button"]:has-text("编辑"), button:has-text("编辑")');
  const editLinkExists = await editLink.isVisible().catch(() => false);
  console.log(`编辑入口: ${editLinkExists}`);
  
  await browser.close();
  console.log('\n截图保存到 /tmp/pos-cat-*.png, /tmp/attendance-*.png, /tmp/profile-*.png');
}

inspect().catch(console.error);
