/**
 * 多格式文件解析工具
 * 支持：CSV, XLSX, XLS, PDF, TXT
 * 返回：{ rows: string[][], error: string|null }
 */
import * as XLSX from 'xlsx';

// PDF.js: 不使用 worker，直接用主线程（简单文本提取足够）

/**
 * 解析任意支持格式的文件
 * @param {File} file
 * @returns {Promise<{ rows: string[][], error: string|null }>}
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  // 诊断
  console.debug('[parseFile]', file.name, 'ext:', ext, 'size:', file.size, 'type:', file.type);

  switch (ext) {
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'csv':
      return parseCSV(file);
    case 'pdf':
      return parsePDF(file);
    case 'txt':
    case 'text':
      return parseText(file);
    default:
      // 尝试当作 CSV 解析
      try {
        return parseCSV(file);
      } catch {
        return { rows: [], error: `不支持的文件格式: .${ext}` };
      }
  }
}

// ========== Excel (xlsx/xls) ==========
async function parseExcel(file) {
  try {
    // file.arrayBuffer() 返回 ArrayBuffer，XLSX 需要 Uint8Array
    const buffer = new Uint8Array(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellNF: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // sheet_to_json 返回对象数组（列名=A/B/C），转为普通数组
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    if (!raw || raw.length < 2) return { rows: [], error: null };
    // xlsx 可能返回对象或数组，统一转为数组
    const rows = raw.map(row => {
      if (Array.isArray(row)) return row;
      if (typeof row === 'object' && row !== null) return Object.values(row);
      return [];
    }).filter(r => r.length > 0 && r.some(c => c != null && c !== ''));
    return { rows, error: null };
  } catch (e) {
    return { rows: [], error: 'Excel 解析失败: ' + e.message };
  }
}

// ========== CSV ==========
async function parseCSV(file) {
  try {
    const text = await file.text();
    // 简单 CSV：逗号分隔，处理引号
    const rows = parseCSVRows(text);
    return { rows, error: null };
  } catch (e) {
    return { rows: [], error: 'CSV 解析失败: ' + e.message };
  }
}

function parseCSVRows(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

// ========== PDF ==========
async function parsePDF(file) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
    const allRows = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const items = content.items;

      // 按 Y 坐标分行（transform[5] = Y）
      const Y_TOLERANCE = 5;
      const lines = [];
      let currentLine = [];
      let lastY = null;

      for (const item of items) {
        // item.str 可能是数字，强制转字符串
        const text = String(item.str || '').trim();
        if (!text) continue;
        // transform[5] = Y 坐标；某些 PDF 项没有 transform，跳过
        if (!item.transform || typeof item.transform[5] !== 'number') continue;
        const y = Math.round(item.transform[5]); // Y 坐标取整
        if (lastY === null) {
          currentLine.push(text);
          lastY = y;
        } else if (Math.abs(y - lastY) <= Y_TOLERANCE) {
          // 同一行
          currentLine.push(text);
        } else {
          // 换行了
          if (currentLine.length > 0) lines.push(currentLine);
          currentLine = [text];
          lastY = y;
        }
      }
      if (currentLine.length > 0) lines.push(currentLine);

      // 将每行转为单元格（尝试用 tab 或多个空格分隔）
      for (const line of lines) {
        const row = line.join('\t').split('\t').map(c => c.trim()).filter(c => c !== '');
        if (row.length > 0) allRows.push(row);
      }
    }

    if (allRows.length === 0) {
      return { rows: [], error: 'PDF 中未找到可识别的文字内容' };
    }
    return { rows: allRows, error: null };
  } catch (e) {
    return { rows: [], error: 'PDF 解析失败: ' + e.message + '（PDF 格式不受支持时会出现此错误）' };
  }
}

// ========== TXT ==========
async function parseText(file) {
  try {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(l => l.trim()).map(l => l.split(/[\t,;]/).map(c => c.trim()));
    return { rows, error: null };
  } catch (e) {
    return { rows: [], error: 'TXT 解析失败: ' + e.message };
  }
}

/**
 * 智能识别表头列位置
 * @param {string[]} header 表头行
 * @param {string[][]} keywords 关键词数组，按优先级排序
 * @returns {number} 列索引，-1 表示未找到
 */
export function findColumnIndex(header, keywords) {
  const lower = header.map(h => String(h || '').toLowerCase());
  for (const kw of keywords) {
    const idx = lower.findIndex(h => h.includes(kw.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}
