/**
 * 餐饮/奶茶行业专用双向自动化翻译工具 (Indonesian <-> Chinese)
 * 支持：
 * 1. 印尼语 -> 中文 (管理员查看店员录入)
 * 2. 中文 -> 印尼语 (店员查看管理员录入)
 */

const businessDictionary = {
  // === 茶叶类 (Teh) ===
  'teh': '茶',
  'hijau': '绿茶',
  'merah': '红茶',
  'hitam': '黑茶',
  'melati': '茉莉',
  'oolong': '乌龙',
  'earl grey': '伯爵',
  'sari': '茶汤',
  'four spring': '四季春',
  
  // === 奶与基底 (Susu & Base) ===
  'susu': '牛奶',
  'fresh milk': '鲜奶',
  'powder': '奶粉',
  'bubuk': '粉末',
  'krimer': '植脂末',
  'cheese': '芝士',
  'foam': '奶盖',
  'oat': '燕麦',
  
  // === 糖与甜度 (Gula) ===
  'gula': '糖',
  'cair': '果糖',
  'pasir': '蔗糖',
  'merah': '红糖/黑糖',
  'aren': '棕榈糖/黑糖',
  'level': '甜度',
  'normal': '常规',
  'less': '少糖',
  'half': '半糖',
  
  // === 冰块与温度 (Es & Temp) ===
  'es': '冰',
  'panas': '热',
  'hangat': '温',
  'batu': '块',
  'less ice': '少冰',
  'no ice': '去冰',
  
  // === 配料 (Topping) ===
  'boba': '珍珠',
  'pearl': '粉圆',
  'pop': '爆爆珠',
  'jelly': '果冻/椰果',
  'pudding': '布丁',
  'cincau': '仙草',
  'grass': '仙草',
  'nata': '椰果',
  'de coco': '椰',
  'taro': '芋泥',
  'paste': '泥/膏',
  'red bean': '红豆',
  'kacang merah': '红豆',
  
  // === 水果 (Buah) ===
  'mangga': '芒果',
  'mango': '芒果',
  'stroberi': '草莓',
  'strawberry': '草莓',
  'jeruk': '橙子',
  'lemon': '柠檬',
  'markisa': '百香果',
  'passion': '百香',
  'anggur': '葡萄',
  'grape': '葡萄',
  'nanas': '菠萝',
  'pineapple': '凤梨',
  'semangka': '西瓜',
  'watermelon': '西瓜',
  'alpukat': '牛油果',
  'avocado': '牛油果',
  
  // === 包装与规格 (Packing & Size) ===
  'gelas': '杯',
  'cup': '杯',
  'besar': '大',
  'kecil': '小',
  'sedang': '中',
  'large': '大杯',
  'medium': '中杯',
  'small': '小杯',
  'tutup': '杯盖',
  'sedotan': '吸管',
  'straw': '吸管',
  'tas': '袋',
  'bag': '袋子',
  'plastik': '塑料',
  
  // === 常用动词/状态 ===
  'tambah': '加',
  'ekstra': '额外',
  'kosong': '缺货',
  'habis': '售罄'
};

// --- 构建反向词典 (中文 -> 印尼语) ---
const reverseDictionary = {
  // 定制短语映射 (优先匹配)
  '珍珠奶茶': 'Boba Milk Tea',
  '红茶': 'Teh Merah',
  '绿茶': 'Teh Hijau',
  '四季春': 'Four Season Spring',
  '茉莉花茶': 'Jasmine Tea',
  '黑糖': 'Gula Aren',
  '鲜奶': 'Fresh Milk',
  '少冰': 'Less Ice',
  '去冰': 'No Ice',
  '少糖': 'Less Sugar',
  '半糖': 'Half Sugar',
  '大杯': 'Large',
  '中杯': 'Medium',
  '小杯': 'Small'
};

// 自动生成剩余的单词映射
Object.entries(businessDictionary).forEach(([id, zh]) => {
  // 如果 zh 包含 '/'，拆分处理
  const zhWords = zh.split('/');
  zhWords.forEach(w => {
    if (!reverseDictionary[w]) {
      reverseDictionary[w] = id;
    }
  });
});

/**
 * 判断是否包含中文字符
 */
const containsChinese = (text) => /[\u4e00-\u9fa5]/.test(text);

/**
 * 智能翻译函数：支持中印双向翻译
 * @param {string} text - 输入文本
 * @param {string} targetLang - 目标语言 ('zh' | 'id')
 * @param {Array} customMappings - 门店自定义映射表 [{sourceText, translatedText, targetLang}]
 */
export const translateBusinessText = (text, targetLang = 'zh', customMappings = []) => {
  if (!text) return '';
  if (typeof text !== 'string') return text;

  // 0. 优先匹配门店自定义字典 (Custom Priority)
  if (Array.isArray(customMappings)) {
    const matched = customMappings.find(m => 
      m.sourceText.toLowerCase() === text.toLowerCase() && 
      m.targetLang === targetLang
    );
    if (matched) return matched.translatedText;
  }

  // 1. 中文翻译场景 ( targetLang: 'zh' )
  if (targetLang === 'zh') {
    // 如果已经是中文，直接返回
    if (containsChinese(text)) return text;

    const words = text.toLowerCase().split(/[\s\-_/]+/);
    let translatedTerms = words.map(word => {
      const cleanWord = word.trim();
      return businessDictionary[cleanWord] || word;
    });
    return translatedTerms.join(' ');
  }

  // 2. 印尼语翻译场景 ( targetLang: 'id' )
  if (targetLang === 'id') {
    // 如果不含中文，假设已经是印尼语或英语，直接返回
    if (!containsChinese(text)) return text;

    // 尝试优先匹配长短语
    let result = text;
    Object.keys(reverseDictionary).sort((a,b) => b.length - a.length).forEach(zhKey => {
       if (result.includes(zhKey)) {
          const reg = new RegExp(zhKey, 'g');
          result = result.replace(reg, ` ${reverseDictionary[zhKey]} `);
       }
    });

    // 进一步精简空格并返回
    return result.replace(/\s+/g, ' ').trim();
  }

  return text;
};
