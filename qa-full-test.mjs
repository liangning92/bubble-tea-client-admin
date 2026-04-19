/**
 * Shopwise POS - 完整 UI 测试 + i18n 一致性检查
 * 目标: https://shopwise.kangningfushou.workers.dev
 * 登录: admin / admin123
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://shopwise.kangningfushou.workers.dev';
const LOCAL_URL = 'http://localhost:6060';
const ADMIN = 'admin';
const ADMIN_PW = 'admin123';

// ============ UI测试页面列表 ============
const UI_PAGES = [
  { path: '/staff?tab=info', name: '员工管理' },
  { path: '/staff?tab=schedule', name: '排班管理' },
  { path: '/staff?tab=attendance', name: '考勤审计' },
  { path: '/staff?tab=training', name: '员工培训' },
  { path: '/staff?tab=reward', name: '奖惩审计' },
  { path: '/staff?tab=hygiene', name: '卫生检查' },
  { path: '/staff?tab=payroll', name: '薪资核算' },
  { path: '/inventory', name: '库存管理' },
  { path: '/product', name: '产品管理' },
  { path: '/profit', name: '利润报表' },
  { path: '/marketing', name: '营销管理' },
  { path: '/settings?tab=profile', name: '商户配置' },
  { path: '/settings?tab=suppliers', name: '供应链' },
  { path: '/settings?tab=pos', name: '收银硬件' },
  { path: '/settings?tab=posSettings', name: 'POS设置' },
  { path: '/settings?tab=posCategories', name: 'POS分类' },
  { path: '/settings?tab=rbac', name: '权限审计' },
  { path: '/settings?tab=system', name: '系统参数' },
];

// ============ i18n测试页面列表 ============
const I18N_PAGES = [
  { path: '/', name: '登录页' },
  { path: '/dashboard', name: '首页' },
  { path: '/staff?tab=info', name: '员工管理' },
  { path: '/inventory', name: '库存管理' },
  { path: '/product', name: '产品管理' },
  { path: '/settings?tab=rbac', name: '权限审计' },
  { path: '/settings?tab=profile', name: '商户配置' },
];

// ============ 截图目录 ============
const SHOT_DIR = '/tmp/shopwise-shots';
import { mkdirSync } from 'fs';
try { mkdirSync(SHOT_DIR, { recursive: true }); } catch(e) {}

let browser, context, page;
let results = { ui: [], i18n: [] };

// ============ 登录 ============
async function login() {
  await page.goto(`${LOCAL_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: `${SHOT_DIR}/00-login.png` });
  
  // 填表单
  const inputs = await page.locator('input').all();
  console.log(`[Login] 发现 ${inputs.length} 个 input`);
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || '';
    const placeholder = await inp.getAttribute('placeholder') || '';
    if (placeholder.toLowerCase().includes('admin') || placeholder.toLowerCase().includes('用户名')) {
      await inp.fill(ADMIN);
    } else if (placeholder.toLowerCase().includes('password') || placeholder.toLowerCase().includes('密码')) {
      await inp.fill(ADMIN_PW);
    } else if (type === 'password') {
      await inp.fill(ADMIN_PW);
    }
  }
  
  // 点登录
  const btns = await page.locator('button').all();
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    if (txt.includes('登录') || txt.includes('Sign') || txt.includes('Login')) {
      await btn.click();
      break;
    }
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SHOT_DIR}/00-after-login.png` });
  console.log('[Login] 登录完成');
}

// ============ UI测试：找并点击编辑按钮 ============
async function testEditButton(pagePath, pageName) {
  const url = `${LOCAL_URL}${pagePath}`;
  const shot = `${SHOT_DIR}/${pageName.replace(/\?|\=/g, '_')}`;
  
  let result = {
    page: pageName,
    path: pagePath,
    editButtonFound: false,
    editButtonText: '',
    modalOpened: false,
    inputs: 0,
    selects: 0,
    buttons: 0,
    error: '',
    consoleErrors: [],
    image: ''
  };
  
  try {
    // 收集控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${shot}-1-before-edit.png` });
    
    // 找编辑按钮 - 多种策略
    const editSelectors = [
      'button:has-text("编辑")',
      'button:has-text("Edit")',
      'button:has-text("✏️")',
      'button:has-text("✎")',
      '[class*="edit"]',
      '[aria-label*="edit" i]',
      '[title*="编辑" i]',
      'tr button:not(:has-text("删除")):not(:has-text("Add")):not(:has-text("添加"))',
      '.ant-btn:not(:has-text("删除"))',
      '.anticon-edit',
      'a:has-text("编辑")',
    ];
    
    let editBtn = null;
    let editBtnText = '';
    
    for (const sel of editSelectors) {
      try {
        const btns = await page.locator(sel).all();
        for (const btn of btns) {
          const visible = await btn.isVisible().catch(() => false);
          const disabled = await btn.isDisabled().catch(() => false);
          if (visible && !disabled) {
            editBtn = btn;
            editBtnText = await btn.innerText().catch(() => sel);
            result.editButtonFound = true;
            result.editButtonText = editBtnText;
            break;
          }
        }
        if (editBtn) break;
      } catch(e) {}
    }
    
    if (!editBtn) {
      // 如果是单页表单（没有列表），找"编辑"入口
      const editLinks = await page.locator('a[href*="edit"], [role="button"]:has-text("编辑")').all();
      for (const link of editLinks) {
        const visible = await link.isVisible().catch(() => false);
        if (visible) {
          editBtn = link;
          editBtnText = await link.innerText().catch(() => 'link');
          result.editButtonFound = true;
          result.editButtonText = editBtnText;
          break;
        }
      }
    }
    
    if (!result.editButtonFound) {
      result.error = '未找到编辑按钮';
      await page.screenshot({ path: `${shot}-2-no-edit-btn.png` });
      result.image = `${shot}-2-no-edit-btn.png`;
      results.ui.push(result);
      return result;
    }
    
    // 点击编辑
    console.log(`[${pageName}] 点击编辑: ${result.editButtonText}`);
    await editBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${shot}-2-after-click.png` });
    
    // 检查弹窗
    const modals = await page.locator('[role="dialog"], .ant-modal, .modal, [class*="modal"]:not(.modal-backdrop)').all();
    const drawer = await page.locator('[role="dialog"][class*="drawer"], .ant-drawer, [class*="drawer"]').all();
    
    result.modalOpened = modals.length > 0 || drawer.length > 0;
    
    // 弹窗内元素统计
    if (result.modalOpened) {
      await page.screenshot({ path: `${shot}-3-modal.png` });
      
      // 等待弹窗渲染
      await page.waitForTimeout(1000);
      
      const allInputs = await page.locator('input:not([type="hidden"])').all();
      const allSelects = await page.locator('select').all();
      const allBtns = await page.locator('button').all();
      const allTextareas = await page.locator('textarea').all();
      
      result.inputs = allInputs.length;
      result.selects = allSelects.length;
      result.buttons = allBtns.length;
      
      // 检查表单是否可操作
      for (const inp of allInputs.slice(0, 3)) {
        try {
          await inp.click({ timeout: 2000 });
          await page.keyboard.press('Escape');
        } catch(e) {}
      }
      
      console.log(`[${pageName}] 弹窗打开: inputs=${result.inputs}, selects=${result.selects}, buttons=${result.buttons}`);
    } else {
      await page.screenshot({ path: `${shot}-3-no-modal.png` });
      result.error = '弹窗未打开';
    }
    
    result.consoleErrors = consoleErrors.slice(0, 5);
    result.image = result.modalOpened ? `${shot}-3-modal.png` : `${shot}-3-no-modal.png`;
    
  } catch(e) {
    result.error = `JS错误: ${e.message}`;
    await page.screenshot({ path: `${shot}-error.png` }).catch(() => {});
    result.image = `${shot}-error.png`;
  }
  
  results.ui.push(result);
  return result;
}

// ============ i18n检查：检查语言混用 ============
async function checkI18n(pagePath, pageName, lang) {
  const url = `${LOCAL_URL}${pagePath}`;
  const shot = `${SHOT_DIR}/i18n-${lang}-${pageName.replace(/\?|\=/g, '_')}`;
  
  let result = {
    lang,
    page: pageName,
    path: pagePath,
    foundIssues: [],
    issues: 0
  };
  
  try {
    // 切换语言
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    
    // 找语言切换器
    const langBtnSelectors = [
      '[class*="lang"]',
      '[class*="locale"]',
      '[class*="language"]',
      'button:has-text("中文")',
      'button:has-text("EN")',
      'button:has-text("ID")',
      'button:has-text("Indonesia")',
      '.ant-dropdown-trigger:has-text("中文")',
      '.ant-select:not([class*="hidden"])',
    ];
    
    let langSwitched = false;
    
    // 先看当前页面是否有语言切换器
    for (const sel of langBtnSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click({ timeout: 2000 });
          await page.waitForTimeout(500);
          
          // 找对应语言的选项
          const langMap = { 'zh': ['中文', '简体中文', 'Chinese'], 'en': ['English', 'EN', '英文'], 'id': ['Indonesia', 'ID', 'Bahasa'] };
          for (const opt of langMap[lang] || []) {
            try {
              const optEl = page.locator(`text="${opt}"`).first();
              if (await optEl.isVisible({ timeout: 1000 })) {
                await optEl.click();
                langSwitched = true;
                break;
              }
            } catch(e) {}
          }
          if (langSwitched) break;
        }
      } catch(e) {}
    }
    
    if (!langSwitched) {
      // 直接通过URL参数切换（如果支持的话）
      const urlWithLang = pagePath.includes('?') 
        ? `${url}&lang=${lang}` 
        : `${url}?lang=${lang}`;
      await page.goto(urlWithLang, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);
    }
    
    await page.screenshot({ path: `${shot}-1.png` });
    
    // 获取页面所有文本
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const allElements = await page.locator('*').all();
    
    // 检测中英混用 / 硬编码语言key
    const chineseChars = /[\u4e00-\u9fa5]/g;
    const englishWords = /\b(edit|delete|add|save|cancel|confirm|submit|reset|loading|error|success|submit|search|filter|export|import)\b/gi;
    
    const chineseMatches = bodyText.match(chineseChars) || [];
    const englishMatches = bodyText.match(englishWords) || [];
    
    // 如果是英文页面但有大量中文字符
    if (lang === 'en' && chineseMatches.length > 5) {
      result.foundIssues.push(`英文页面存在 ${chineseMatches.length} 个中文字符`);
      result.issues++;
    }
    
    // 如果是中文页面但有大量英文单词
    if (lang === 'zh' && englishMatches.length > 20) {
      result.foundIssues.push(`中文页面存在 ${englishMatches.length} 个英文单词(可能是硬编码)`);
      result.issues++;
    }
    
    // 如果是印尼语页面
    if (lang === 'id') {
      if (chineseMatches.length > 3) {
        result.foundIssues.push(`印尼语页面存在 ${chineseMatches.length} 个中文字符`);
        result.issues++;
      }
      if (englishMatches.length > 20) {
        result.foundIssues.push(`印尼语页面存在 ${englishMatches.length} 个英文单词`);
        result.issues++;
      }
    }
    
    // 检查按钮和表单label
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const txt = await btn.innerText().catch(() => '');
      if (txt && txt.trim().length > 0) {
        // 检查是否有明显的语言不一致
        const hasChinese = /[\u4e00-\u9fa5]/.test(txt);
        const hasEnglish = /[a-zA-Z]{3,}/.test(txt);
        if (lang === 'en' && hasChinese) {
          result.foundIssues.push(`按钮含中文: "${txt.substring(0, 20)}"`);
          result.issues++;
        }
        if (lang === 'zh' && hasEnglish && !hasChinese) {
          // 中英混杂
        }
      }
    }
    
    // 检查placeholder
    const inputs = await page.locator('input[placeholder]').all();
    for (const inp of inputs) {
      const ph = await inp.getAttribute('placeholder').catch(() => '');
      if (ph && ph.length > 0) {
        const hasChinese = /[\u4e00-\u9fa5]/.test(ph);
        const hasEnglish = /[a-zA-Z]{3,}/.test(ph);
        if (lang === 'en' && hasChinese) {
          result.foundIssues.push(`输入框placeholder含中文: "${ph.substring(0, 20)}"`);
          result.issues++;
        }
      }
    }
    
    console.log(`[i18n:${lang}:${pageName}] ${result.issues} 个问题`);
    
  } catch(e) {
    result.foundIssues.push(`异常: ${e.message}`);
    result.issues++;
    await page.screenshot({ path: `${shot}-error.png` }).catch(() => {});
  }
  
  results.i18n.push(result);
  return result;
}

// ============ 主测试流程 ============
async function run() {
  console.log('=== Shopwise QA 测试开始 ===');
  console.log(`目标: ${LOCAL_URL}`);
  console.log(`截图目录: ${SHOT_DIR}`);
  
  browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  page = await context.newPage();
  
  // 登录
  await login();
  
  // ===== 任务1: UI测试 =====
  console.log('\n========== UI测试 ==========');
  for (const p of UI_PAGES) {
    await testEditButton(p.path, p.name);
    await page.waitForTimeout(500);
  }
  
  // ===== 任务2: i18n检查 =====
  console.log('\n========== i18n检查 ==========');
  for (const p of I18N_PAGES) {
    for (const lang of ['zh', 'en', 'id']) {
      await checkI18n(p.path, p.name, lang);
      await page.waitForTimeout(500);
    }
  }
  
  await browser.close();
  
  // ===== 输出结果 =====
  console.log('\n\n========== 测试结果 ==========');
  
  console.log('\n## UI 测试结果');
  console.log('| 页面 | 编辑按钮 | 弹窗状态 | 问题 |');
  console.log('|------|----------|----------|------|');
  for (const r of results.ui) {
    const status = r.modalOpened ? '✅ 正常' : (r.editButtonFound ? '❌ 弹窗未开' : '⚠️ 无编辑按钮');
    const issues = r.error || (r.consoleErrors.length > 0 ? `控制台错误(${r.consoleErrors.length})` : (r.inputs === 0 ? '表单为空' : ''));
    console.log(`| ${r.page} | ${r.editButtonFound ? '✅ ' + r.editButtonText.substring(0, 15) : '❌ 未找到'} | ${status} | ${issues} |`);
  }
  
  console.log('\n## i18n 检查结果');
  console.log('| 语言 | 页面 | 发现的问题 |');
  console.log('|------|------|------------|');
  for (const r of results.i18n) {
    if (r.issues > 0) {
      console.log(`| ${r.lang} | ${r.page} | ${r.foundIssues.slice(0, 3).join('; ')} |`);
    } else {
      console.log(`| ${r.lang} | ${r.page} | ✅ 无明显问题 |`);
    }
  }
  
  console.log(`\n截图已保存到: ${SHOT_DIR}`);
  console.log('\n========== 测试完成 ==========');
}

run().catch(e => {
  console.error('测试失败:', e);
  process.exit(1);
});
