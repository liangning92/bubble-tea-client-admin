import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';

export default function POSHardwareConfig() {
  const { t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    mode: 'dual',
    modules: {
      member: true,
      discount: true,
      quickProducts: true,
      inventoryAlert: true
    },
    customerDisplay: {
      showAds: true,
      showItems: true,
      showQR: true,
      showLogo: true
    },
    permissions: {
      editPrice: false,
      cancelOrder: false,
      returnOrder: false
    },
    posHardwareLogs: []
  });

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/system/config');
      if (res && !res.error) {
        const dualConfig = res.posDualConfig || {};
        setConfig({
          mode: dualConfig.mode || res.posDisplayMode || 'dual',
          modules: dualConfig.modules || config.modules,
          customerDisplay: dualConfig.customerDisplay || config.customerDisplay,
          permissions: dualConfig.permissions || config.permissions,
          posHardwareLogs: [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleSave = async (newCfg = config) => {
    try {
      const payload = {
        posDisplayMode: newCfg.mode,
        posDualConfig: {
          mode: newCfg.mode,
          modules: newCfg.modules,
          customerDisplay: newCfg.customerDisplay,
          permissions: newCfg.permissions,
        },
      };
      await api('POST', '/system/config', payload);
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('syncSuccess') }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app:error', { detail: t('syncFailed') }));
    }
  };

  const toggleModule = (key) => {
    const newModules = { ...config.modules, [key]: !config.modules[key] };
    const newCfg = { ...config, modules: newModules };
    setConfig(newCfg);
    handleSave(newCfg);
  };

  if (loading && !config.posHardwareLogs.length) return <div className="py-24 text-center text-label-caps animate-pulse">{t('loading') || '正在同步...'}</div>;

  return (
    <div className="space-y-6 animate-soft text-slate-900 pb-24">
      {/* 统一页头 - 纯净汉化 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 px-4 gap-6">
        <div className="space-y-4">
          <h3 className="text-h2 uppercase">{t('posSetupTitle') || '收银终端硬件配置'}</h3>
          <p className="text-label-caps mt-1 !text-slate-400">{t('posSetupSubtitle')}</p>
        </div>
        <div className="flex gap-4">
           <button onClick={loadConfig} className="btn-premium !px-4 bg-white border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[12px]">{t('refresh') || '刷新'}</button>
           <button onClick={() => handleSave()} className="btn-premium active !bg-slate-900 !text-white !px-10 !py-3 border-none shadow-xl shadow-slate-900/10 uppercase tracking-widest text-[13px] font-black">
              {t('syncToTerminals') || '同步至收银终端'}
           </button>
        </div>
      </div>

      {/* 模式选择 - 纯汉化 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <div 
          onClick={() => { setConfig({...config, mode: 'single'}); handleSave({...config, mode: 'single'}); }}
          className={`card-premium !p-8 flex items-center gap-6 cursor-pointer transition-all !rounded-[40px] border-2 ${config.mode === 'single' ? 'border-primary bg-primary/5' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
        >
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-4xl shadow-inner">📱</div>
          <div className="flex-1 space-y-4">
            <h3 className="text-[18px] font-black text-slate-900 uppercase">{t('posSingleMode') || '单屏收银模式'}</h3>
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-tight opacity-70">
               {t('singleModeDesc') || '仅显示收银员操作界面，适用于紧凑型吧台'}
            </p>
          </div>
          <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${config.mode === 'single' ? 'border-primary' : 'border-slate-100'}`}>
            {config.mode === 'single' && <div className="w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/40" />}
          </div>
        </div>

        <div 
          onClick={() => { setConfig({...config, mode: 'dual'}); handleSave({...config, mode: 'dual'}); }}
          className={`card-premium !p-8 flex items-center gap-6 cursor-pointer transition-all !rounded-[40px] border-2 ${config.mode === 'dual' ? 'border-primary bg-primary/5' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
        >
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-4xl shadow-inner">💻</div>
          <div className="flex-1 space-y-4">
            <h3 className="text-[18px] font-black text-slate-900 uppercase">{t('posDualMode') || '双屏客显模式'}</h3>
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-tight opacity-70">
               {t('dualModeDesc') || '主屏收银，副屏同步订单详情与品牌广告'}
            </p>
          </div>
          <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${config.mode === 'dual' ? 'border-primary' : 'border-slate-100'}`}>
            {config.mode === 'dual' && <div className="w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/40" />}
          </div>
        </div>
      </div>

      {/* 模块可见性 */}
      <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm">
         <div className="flex items-center gap-4 mb-10">
            <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
            <h4 className="text-[16px] font-black text-slate-900 uppercase tracking-widest">{t('interfaceConfiguration') || '收银员交互界面配置'}</h4>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'member', label: t('clerkMemberModule') || '会员管理模块', icon: '👤' },
              { key: 'discount', label: t('clerkDiscountModule') || '折扣与代金券', icon: '🏷️' },
              { key: 'quickProducts', label: t('clerkQuickProducts') || '快捷选品矩阵', icon: '⚡' },
              { key: 'inventoryAlert', label: t('clerkInventoryAlert') || '实时库存提醒', icon: '📦' },
            ].map(item => (
              <div 
                key={item.key} 
                onClick={() => toggleModule(item.key)}
                className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center gap-4 ${config.modules[item.key] ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'border-slate-50 bg-slate-50 text-slate-400 whitespace-nowrap overflow-hidden'}`}
              >
                 <span className="text-2xl">{item.icon}</span>
                 <span className="text-[13px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
         </div>
      </div>

      {/* 双屏详细配置入口 */}
      <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
            <h4 className="text-[16px] font-black text-slate-900 uppercase tracking-widest">{t('dualScreenAdvanced') || '双屏高级配置'}</h4>
         </div>
         <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl">💻</div>
               <div>
                  <h5 className="text-lg font-black text-slate-900">{t('dualScreenConfigTitle') || '副屏显示与提醒设置'}</h5>
                  <p className="text-sm text-slate-400">{t('dualScreenConfigSubtitle') || '配置顾客显示屏内容、员工考勤二维码、定时提醒'}</p>
               </div>
            </div>
            <Link
               to="/pos/dual-config"
               className="btn-premium active !bg-orange-500 !text-white !px-8 !py-4 border-none shadow-xl shadow-orange-500/20 uppercase tracking-widest text-[13px] font-black"
            >
               {t('configure') || '配置' } →
            </Link>
         </div>
      </div>
    </div>
  );
}
