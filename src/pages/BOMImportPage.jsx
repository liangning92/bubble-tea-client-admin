import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { parseFile, findColumnIndex } from '../utils/fileParser';

export default function BOMImportPage() {
  const { t, lang, user } = useAuth();
  const tl = (zh, en, id) => lang === 'zh' ? zh : lang === 'en' ? en : id;
  const [inventory, setInventory] = useState([]);
  const [bom, setBom] = useState([]);
  const [batchText, setBatchText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [showBatch, setShowBatch] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, bomData] = await Promise.all([
        api('GET', '/inventory'),
        api('GET', '/bom')
      ]);
      setInventory(Array.isArray(invData) ? invData : (invData?.data || []));
      setBom(Array.isArray(bomData) ? bomData : (bomData?.data || []));
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const parseBatchText = () => {
    if (!batchText.trim()) { setParsedItems([]); return; }
    if (inventory.length === 0) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: tl('原料库加载中，请稍后再试', 'Inventory loading, please try again', 'Inventaris sedang dimuat, coba lagi') }));
      return;
    }
    const lines = batchText.trim().split('\n');
    const items = lines.map(line => {
      const parts = line.trim().split(/[\t\s,;|。]+/).filter(p => p.trim());
      if (parts.length >= 3) {
        const productName = parts[0].trim();
        const ingredientName = parts[1].trim();
        const usage = parseFloat(parts[2]) || 0;

        const matched = inventory.find(i =>
          i.name.includes(ingredientName) || ingredientName.includes(i.name)
        );

        return { productName, ingredientName, usage, inventoryId: matched?.id, matched, _raw: line };
      }
      return { _raw: line, _error: tl('需要: 产品名 原料名 用量', 'Required: ProductName IngredientName Usage', 'Diperlukan: Nama Produk Nama Bahan Jumlah') };
    }).filter(Boolean);
    setParsedItems(items);
  };

  const handleExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (inventory.length === 0) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: tl('原料库加载中，请稍后再试', 'Inventory loading, please try again', 'Inventaris sedang dimuat, coba lagi') }));
      return;
    }

    try {
      const { rows, error } = await parseFile(file);
      if (error || rows.length < 2) {
        window.dispatchEvent(new CustomEvent('app:error', { detail: error || tl('文件无有效数据', 'No valid data', 'Tidak ada data valid') }));
        return;
      }

      const header = rows[0];
      const productNameIdx = findColumnIndex(header, ['product', '产品', 'produk', 'name', '名称']);
      const ingredientNameIdx = findColumnIndex(header, ['ingredient', '原料', 'bahan', 'material', 'item']);
      const usageIdx = findColumnIndex(header, ['usage', 'quantity', 'qty', '用量', 'jumlah', 'amount']);
      const getVal = (row, idx) => idx >= 0 && idx < row.length ? String(row[idx] || '').trim() : '';

      const allItems = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some(c => c)) continue;
        const productName = productNameIdx >= 0 ? getVal(row, productNameIdx) : '';
        const ingredientName = ingredientNameIdx >= 0 ? getVal(row, ingredientNameIdx) : getVal(row, 0);
        const usage = parseFloat(usageIdx >= 0 ? getVal(row, usageIdx) : getVal(row, 1)) || 1;
        if (!ingredientName || ingredientName === productName) continue;
        const matched = inventory.find(inv =>
          inv.name.includes(ingredientName) || ingredientName.includes(inv.name)
        );
        allItems.push({ productName, ingredientName, usage, inventoryId: matched?.id, matched });
      }
      setParsedItems(allItems.filter(i => i.ingredientName && i.usage > 0));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: tl('解析失败', 'Parse failed', 'Gagal parse') + ': ' + err.message }));
    }
  };

  const handleBatchImport = async () => {
    if (!isAdmin) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: tl('只有管理员可以导入配方', 'Only admin can import recipes', 'Hanya admin yang dapat mengimpor resep') }));
      return;
    }

    const validItems = parsedItems.filter(i => !i._error && i.matched && i.usage > 0);
    if (validItems.length === 0) {
      const unmatchedCount = parsedItems.filter(i => !i._error && !i.matched).length;
      if (unmatchedCount > 0) {
        alert(tl('没有可导入的项，所有项均未匹配到原料库', 'No importable items — all items failed to match inventory', 'Tidak ada item yang dapat diimpor — semua item tidak cocok dengan inventaris'));
      } else {
        alert(tl('没有可导入的项', 'No importable items', 'Tidak ada item yang dapat diimpor'));
      }
      return;
    }

    try {
      const batchItems = validItems.map(item => ({
        productName: item.productName,
        inventoryId: item.inventoryId,
        usageAmount: item.usage
      }));
      const result = await api('POST', '/bom/batch', { items: batchItems });
      if (result?.error) return;
      window.dispatchEvent(new CustomEvent('app:success', { detail: tl(`成功导入 ${batchItems.length} 项配方`, `Successfully imported ${batchItems.length} items`, `Berhasil impor ${batchItems.length} item`) }));
      setShowBatch(false);
      setBatchText('');
      setParsedItems([]);
      loadData();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: tl('导入失败', 'Import failed', 'Impor gagal') + ': ' + (err.message || '') }));
    }
  };

  // 聚合成按产品分组的配方树
  const groupedBom = Object.entries(bom.reduce((acc, item) => {
    if (!acc[item.productName]) acc[item.productName] = [];
    acc[item.productName].push(item);
    return acc;
  }, {}));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span>🧬</span> {tl('配方与 BOM 矩阵', 'Recipe & BOM Matrix', 'Matriks Resep & BOM')}
        </h2>
        <button onClick={() => setShowBatch(true)} className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20">
          📥 {tl('批量导入配方', 'Batch Import', 'Impor Massal')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-bold">{tl('配方树加载中...', 'Loading...', 'Memuat...')}</div>
      ) : (
      <>
        {!isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 text-sm text-yellow-700 font-medium flex items-center gap-2">
            <span>⚠️</span> {tl('您没有管理员权限，无法导入配方。如需导入，请联系超级管理员（通常为总部）。', 'You do not have admin permission to import recipes. Contact headquarters if needed.', 'Anda tidak memiliki izin admin untuk mengimpor resep. Hubungi pusat jika perlu.')}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groupedBom.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
              <div className="text-5xl mb-4">🧬</div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">{tl('BOM 矩阵是空的', 'BOM Matrix is Empty', 'Matriks BOM Kosong')}</h3>
              <p className="text-slate-500">{tl('点击右上角导入原材料配方表', 'Click top right to import recipes', 'Klik kanan atas untuk impor resep')}</p>
            </div>
          ) : (
            groupedBom.map(([productName, items]) => (
              <div key={productName} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-200 transition-all group relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full blur-xl group-hover:bg-blue-100 transition-colors pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="font-bold text-blue-700 text-lg mb-4 flex items-center gap-2 border-b border-blue-50 pb-2">
                    <span>🧋</span> {productName}
                  </h3>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group/item">
                        <div className="flex flex-col">
                           <span className="text-slate-700 font-bold">{item.inventory?.name || tl('未知原料', 'Unknown', 'Bahan tidak dikenal')}</span>
                           <span className="text-[14px] text-slate-400 font-medium">1 {tl('杯/份', 'cup/unit', 'cup/unit')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center bg-white border border-slate-200 rounded-lg px-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                              <input 
                                type="number" 
                                defaultValue={item.usageAmount}
                                onBlur={async (e) => {
                                  const val = parseFloat(e.target.value);
                                  if (val !== item.usageAmount && val > 0) {
                                    const res = await api('PUT', `/products/bom/${item.id}`, { usageAmount: val });
                                    if (!res.error) {
                                      window.dispatchEvent(new CustomEvent('app:success', { detail: tl('配方已修正', 'Recipe adjusted', 'Resep disesuaikan') }));
                                      loadData();
                                    }
                                  }
                                }}
                                className="w-14 bg-transparent text-right font-black text-blue-600 focus:outline-none py-1"
                              />
                              <span className="text-[14px] text-slate-400 font-bold ml-1 uppercase">{item.inventory?.unit}</span>
                           </div>
                           <button 
                             onClick={async () => {
                               if (window.confirm(tl('从配方中移除此项？', 'Remove from recipe?', 'Hapus dari resep?'))) {
                                  const res = await api('DELETE', `/products/bom/${item.id}`);
                                  if (!res.error) {
                                    window.dispatchEvent(new CustomEvent('app:success', { detail: tl('已移除', 'Removed', 'Dihapus') }));
                                    loadData();
                                  }
                               }
                             }}
                             className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-lg transition-all"
                           >
                             ✕
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </>
      )}

      {/* 高级遮罩抽屉动画 (Batch Import) */}
      {showBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBatch(false)}></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 transform transition-all scale-100 border border-slate-100 no-scrollbar">
            <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-3">
              <span>📥</span> {tl('BOM 配方数据灌入', 'Import BOM Data', 'Impor Data BOM')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center hover:bg-blue-100/50 transition">
                <div className="text-4xl mb-3">📊</div>
                <h4 className="font-bold text-blue-800 mb-1">{tl('智能表格读取', 'Smart Excel Read', 'Baca Excel Pintar')}</h4>
                <p className="text-[14px] text-blue-600/70 mb-4">{tl('支持 xlsx, xls 等标准扩展名', 'Supports xlsx, xls extensions', 'Mendukung ekstensi xlsx, xls')}</p>
                <label className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20 cursor-pointer text-sm">
                  {tl('选择实体文件', 'Select File', 'Pilih File')}
                  <input type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleExcelFile} className="hidden" />
                </label>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                 <h4 className="font-bold text-slate-700 mb-1 text-sm">{tl('裸文本解析', 'Raw Text Parse', 'Urai Teks Mentah')}</h4>
                 <p className="text-[14px] text-slate-500 mb-3 block">{tl('格式：[产品] [原料] [用量]', 'Format: [Product] [Ingredient] [Amount]', 'Format: [Produk] [Bahan] [Jumlah]')}</p>
                 <textarea
                  className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3 resize-none"
                  placeholder={tl('波霸奶茶 珍珠 30\n波霸奶茶 奶茶液 250', 'Boba Tea Boba 30\nBoba Tea Milk 250', 'Teh Boba Boba 30\nTeh Boba Susu 250')}
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                 />
                 <button onClick={parseBatchText} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition text-sm">
                   {tl('解析文本', 'Parse Text', 'Urai Teks')}
                 </button>
              </div>
            </div>

            {parsedItems.length > 0 && (
              <div className="mb-8">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span>✨</span> {tl('解析结果预览', 'Parse Results Preview', 'Pratinjau Hasil Urai')} <span className="bg-blue-100 text-blue-700 px-4 py-0.5 rounded-full text-[14px]">共 {parsedItems.length} 项</span>
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-4">
                  {parsedItems.map((item, i) => (
                    item._error ? (
                      <div key={i} className="text-[14px] bg-red-50 p-3 rounded-xl text-red-600 border border-red-100 font-medium flex items-center gap-2">
                        <span>❌</span> <span>{item._raw} - {item._error}</span>
                      </div>
                    ) : (
                      <div key={i} className={`text-[14px] p-3 rounded-xl border font-medium flex items-center justify-between ${item.matched ? 'bg-green-50 border-green-100 text-green-800' : 'bg-yellow-50 border-yellow-100 text-yellow-800'}`}>
                        <div className="flex items-center gap-2">
                          <span className="bg-white px-4 py-1 rounded shadow-sm">{item.productName}</span> 
                          <span className="text-slate-400">+</span>
                          <span className="bg-white px-4 py-1 rounded shadow-sm">{item.ingredientName}</span>
                          <span className="text-slate-400">×</span>
                          <span className="font-black">{item.usage}</span>
                        </div>
                        <div>
                          {item.matched ? <span className="flex items-center gap-1"><span>✅</span> 映射: {item.matched.name}</span> : <span className="flex items-center gap-1"><span>⚠️</span> {tl('未找到映射', 'Unmapped', 'Tidak dipetakan')}</span>}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={handleBatchImport} 
                disabled={parsedItems.filter(i => !i._error && i.matched).length === 0}
                className="flex-[2] py-3 bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-emerald-600 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-500/20 text-lg"
              >
                {tl('确认灌入数据库', 'Confirm & Import Database', 'Konfirmasi & Impor ke Database')} ({parsedItems.filter(i => !i._error && i.matched).length})
              </button>
              <button onClick={() => { setShowBatch(false); setBatchText(''); setParsedItems([]); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
                {tl('取消', 'Cancel', 'Batal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
