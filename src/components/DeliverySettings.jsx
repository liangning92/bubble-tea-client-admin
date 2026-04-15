import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function DeliverySettings() {
  const { lang } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [config, setConfig] = useState({
    deliveryGrabStatus: true,
    deliveryGoFoodStatus: true,
    deliveryShopeeStatus: true,
    deliveryAutoAccept: false,
    deliveryPriceMarkup: 20,
    deliveryCategoryMarkups: {},
    deliveryGrabApiKey: '',
    deliveryGoFoodApiKey: '',
    deliveryShopeeApiKey: '',
    smartOpsBuffer: 5,
    profitMarginFloor: 25
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, productData] = await Promise.all([
        api('GET', '/system/config'),
        api('GET', '/products')
      ]);
      
      if (!configData.error) {
        setConfig(prev => ({ ...prev, ...configData }));
      }
      
      if (!productData.error) {
        const uniqueCats = [...new Set(productData.map(p => p.category))].filter(Boolean);
        setCategories(uniqueCats);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (updatedConfig) => {
    setSaving(true);
    try {
      const payload = updatedConfig || config;
      const res = await api('POST', '/system/config', payload);
      if (!res.error) {
        window.dispatchEvent(new CustomEvent('app:success', { 
          detail: lang === 'zh' ? '配置已同步至后台' : 'Settings synced' 
        }));
        if (updatedConfig) setConfig(updatedConfig);
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: '保存失败' }));
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryMarkupChange = (cat, val) => {
    const newMarkups = { ...config.deliveryCategoryMarkups, [cat]: parseInt(val) || 0 };
    setConfig({ ...config, deliveryCategoryMarkups: newMarkups });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
      <p className="text-[14px] font-black uppercase tracking-widest">Initialising Core Config...</p>
    </div>
  );

  const platforms = [
    { key: 'deliveryGrabStatus', apiKey: 'deliveryGrabApiKey', name: 'GrabFood', icon: '🛵', color: 'emerald' },
    { key: 'deliveryGoFoodStatus', apiKey: 'deliveryGoFoodApiKey', name: 'GoFood', icon: '🚀', color: 'red' },
    { key: 'deliveryShopeeStatus', apiKey: 'deliveryShopeeApiKey', name: 'ShopeeFood', icon: '🧡', color: 'orange' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* 1. 平台状态与 API 管理 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">平台集成与 API 托管</h3>
          <button 
            onClick={() => setShowKeys(!showKeys)}
            className="px-4 py-2 bg-slate-100 text-slate-600 text-[14px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest"
          >
            {showKeys ? '🙈 隐藏密钥' : '👁️ 管理接口密钥'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map(p => (
            <div key={p.key} className={`p-8 rounded-[40px] border-2 transition-all ${config[p.key] ? `bg-white border-${p.color}-100 shadow-xl shadow-${p.color}-500/5` : 'bg-slate-50 border-slate-100 opacity-60'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${config[p.key] ? `bg-${p.color}-50 text-${p.color}-600` : 'bg-slate-200 text-slate-400'}`}>
                  {p.icon}
                </div>
                <button 
                  onClick={() => handleSave({ ...config, [p.key]: !config[p.key] })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${config[p.key] ? `bg-${p.color}-500` : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config[p.key] ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-1">{p.name}</h4>
              
              {showKeys ? (
                <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1 block">API Secret Key</label>
                  <input 
                    type="password"
                    value={config[p.apiKey]}
                    onChange={(e) => setConfig({ ...config, [p.apiKey]: e.target.value })}
                    onBlur={() => handleSave()}
                    placeholder="Enter API Key..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[14px] font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              ) : (
                <p className={`text-[14px] font-black uppercase tracking-widest ${config[p.key] ? `text-${p.color}-500` : 'text-slate-400'}`}>
                  {config[p.key] ? 'Channel Active' : 'Channel Inactive'}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. 双重定价策略引擎 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 全局加价控制 */}
        <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
          <div className="flex justify-between items-start">
            <h4 className="text-xl font-black text-slate-800">全局调价中心</h4>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[14px] font-black rounded-full uppercase tracking-widest">Base Layer</span>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
               <div className="flex justify-between items-end px-2">
                 <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest">一键全局加价比例 (Common %)</label>
                 <span className="text-3xl font-black text-indigo-600">{config.deliveryPriceMarkup}%</span>
               </div>
               <input 
                 type="range" min="0" max="100" step="1"
                 value={config.deliveryPriceMarkup}
                 onMouseUp={() => handleSave()}
                 onChange={(e) => setConfig({ ...config, deliveryPriceMarkup: parseInt(e.target.value) })}
                 className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               />
               <p className="text-[14px] text-slate-400 font-medium ">此比例将应用于所有未设置独立加价的品类。</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">自动确认接单 (Auto-Process)</p>
                <p className="text-[14px] text-slate-400 font-medium mt-0.5">自动处理待接订单，减少人工漏单</p>
              </div>
              <button 
                onClick={() => handleSave({ ...config, deliveryAutoAccept: !config.deliveryAutoAccept })}
                className={`w-12 h-7 rounded-full relative transition-all ${config.deliveryAutoAccept ? 'bg-indigo-600 shadow-lg' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${config.deliveryAutoAccept ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* 细分品类加价 (Priority Layer) */}
        <div className="bg-slate-950 p-10 rounded-[48px] text-white shadow-2xl space-y-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
               <h4 className="text-xl font-black text-white">品类独立加价</h4>
               <span className="px-3 py-1 bg-white/10 text-white/60 text-[14px] font-black rounded-full uppercase tracking-widest border border-white/10">Priority Override</span>
            </div>
            <p className="text-[14px] text-slate-400 font-medium mt-2">品类加价优先级最高。若此处有值，则该品类忽略全局加价。</p>
          </div>

          <div className="relative z-10 space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {categories.map(cat => (
              <div key={cat} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                   <span className="font-bold text-sm tracking-tight">{cat}</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <input 
                        type="number"
                        value={config.deliveryCategoryMarkups[cat] || ''}
                        onChange={(e) => handleCategoryMarkupChange(cat, e.target.value)}
                        onBlur={() => handleSave()}
                        placeholder={config.deliveryPriceMarkup}
                        className="w-20 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-right font-black text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                      <span className="absolute right-2 top-2.5 text-[14px] opacity-40">%</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        </div>
      </section>

      {/* 底部操作反馈 */}
      <div className="p-8 bg-amber-50 rounded-[40px] border border-amber-100 flex items-center gap-6">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">⚠️</div>
         <p className="text-[13px] text-amber-900 font-bold leading-relaxed">
           <b>价格同步警告：</b> 调价生效可能受外卖平台接口限频影响。大面积调价建议在非高峰期进行。更改后的价格将自动更新至门店收银端及关联的所有外卖渠道。
         </p>
      </div>

    </div>
  );
}
