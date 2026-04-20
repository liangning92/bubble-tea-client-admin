/**
 * 全面扫描所有页面的硬编码英文/中文残留
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:6060';
const results = [];
let browser, page;

function log(tag, msg) {
  console.log(`[${tag}] ${msg}`);
  results.push(`[${tag}] ${msg}`);
}

async function login() {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/portal**', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function scanPage(name, path) {
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 12000 });
    await page.waitForTimeout(2500);

    const allText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node; const texts = [];
      while (node = walker.nextNode()) {
        const t = node.textContent?.trim();
        if (t && t.length > 1 && t.length < 300 && node.parentElement?.offsetParent !== null) {
          texts.push(t);
        }
      }
      return texts;
    });

    const englishWords = [];
    const stopWords = new Set(['true','false','null','undefined','NaN','loading','loading...','...','|','/','-','&','©','®','™','°','·','●','○','•','↔','→','←','↑','↓','✓','✕','★','☆','♠','♣','♥','♦','✔','✖','©','SHOPPING','PRODUCT','STAFF']);
    for (const text of allText) {
      const matches = text.match(/\b[A-Za-z]{3,30}\b/g) || [];
      for (const m of matches) {
        if (!stopWords.has(m.toLowerCase()) &&
            !['admin','login','logout','dashboard','home','settings'].includes(m.toLowerCase()) &&
            !['zh','en','id','api','app','id:'].includes(m.toLowerCase()) &&
            !m.match(/^\d+$/) &&
            !m.match(/^[A-Z]{2,}$/) &&
            !m.match(/\d{2,}/)) {
          englishWords.push({ word: m, context: text.slice(0, 80) });
        }
      }
    }

    const mixedChinese = [];
    for (const text of allText) {
      if (/[A-Za-z]{3,}/.test(text) && /[\u4e00-\u9fff]/.test(text)) {
        mixedChinese.push(text.slice(0, 100));
      }
    }

    const uniqueEn = [...new Map(englishWords.map(e => [e.word, e])).values()];
    if (uniqueEn.length > 0) {
      log('EN', `${name} (${path}): ${uniqueEn.slice(0,12).map(e => `"${e.word}"`).join(' | ')}`);
    }
    if (mixedChinese.length > 0) {
      log('MIX', `${name}: ${mixedChinese.slice(0,3).join(' | ')}`);
    }
  } catch(e) {
    log('ERR', `${name}: ${e.message.slice(0,80)}`);
  }
}

(async () => {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  await login();

  log('SCAN', '=== 开始全面i18n扫描 ===');
  const pages = [
    { name: '工作台', path: '/portal' },
    { name: '员工-信息', path: '/staff?tab=info' },
    { name: '员工-排班', path: '/staff?tab=schedule' },
    { name: '员工-工资', path: '/staff?tab=payroll' },
    { name: '工资规则', path: '/payroll' },
    { name: '产品', path: '/product' },
    { name: '配方BOM', path: '/product?tab=bom' },
    { name: '库存', path: '/inventory' },
    { name: '库存异常', path: '/inventory?tab=anomalyWarning' },
    { name: '入库', path: '/inventory?tab=stockIn' },
    { name: '出库', path: '/inventory?tab=stockOut' },
    { name: '收银台', path: '/pos' },
    { name: 'POS设置', path: '/pos/settings' },
    { name: '营收', path: '/sales' },
    { name: '利润', path: '/profit' },
    { name: '费用', path: '/expense' },
    { name: '采购', path: '/purchase' },
    { name: 'CRM营销', path: '/crm' },
    { name: '优惠券', path: '/coupon-factory' },
    { name: '活动', path: '/campaigns' },
    { name: '排行榜', path: '/leaderboard' },
    { name: '卫生', path: '/hygiene' },
    { name: '培训', path: '/training' },
    { name: '奖惩', path: '/reward' },
    { name: '考勤', path: '/attendance' },
    { name: '门店设置', path: '/settings?tab=profile' },
    { name: '权限矩阵', path: '/settings?tab=rbac' },
  ];

  for (const p of pages) {
    await scanPage(p.name, p.path);
  }

  await page.goto(BASE + '/portal', { waitUntil: 'networkidle', timeout: 12000 });
  await page.waitForTimeout(2000);
  const sidebarText = await page.evaluate(() => {
    const sidebar = document.querySelector('aside') || document.body;
    return Array.from(sidebar.querySelectorAll('*')).map(el => el.innerText?.trim()).filter(t => t && t.length < 100).join('\n');
  });
  log('SIDEBAR', sidebarText.slice(0, 500));

  await browser.close();
  log('DONE', '扫描完成');
  console.log('\n======== 完整结果 ========');
  results.forEach(r => console.log(r));
  process.exit(0);
})();
