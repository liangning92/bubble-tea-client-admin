import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubNav from '../components/SubNav';
import InventoryPage from './Inventory';
import StockInPage from './StockIn';
import StockOutPage from './StockOut';
import InventoryAnomalyPage from './InventoryAnomalyPage';
import SmartRestock from './SmartRestock';

export default function InventoryHub() {
  const { t } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = [
    { key: 'stockList', icon: '📋', label: t('stockList') },
    { key: 'stockIn', icon: '📥', label: t('stockIn') },
    { key: 'stockOut', icon: '📤', label: t('stockOut') },
    { key: 'physicalAudit', icon: '🔍', label: t('physicalAudit') },
    { key: 'anomalyWarning', icon: '⚠️', label: t('anomalyWarning') },
    { key: 'reorderList', icon: '🚚', label: t('reorderList') },
  ];

  let tab = searchParams.get('tab') || 'stockList';
  const handleTabChange = (key) => setSearchParams({ tab: key });

  return (
    <div className="animate-soft space-y-8 focus:outline-none text-slate-900 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
             <span className="text-3xl">📦</span> 智能库存与仓储管理中心
          </h2>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-900 text-white p-5 rounded-[28px] shadow-xl shadow-slate-900/10">
           <div className="flex items-center gap-4 pr-6 border-r border-white/20">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[12px] font-black uppercase tracking-widest">终端实时联动已激活</span>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[12px] font-black text-white/50 uppercase tracking-widest">预防超卖预警: 5%</span>
              <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">⚙️</button>
           </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar py-3">
        <SubNav 
          tabs={tabs} 
          activeTab={tab} 
          onTabChange={handleTabChange} 
        />
      </div>

      <div className="min-h-[60vh] bg-white rounded-[48px] p-8 border border-slate-50 shadow-sm relative overflow-hidden">
        {tab === 'stockList' && <InventoryPage readOnly={true} hideHeader={true} />}
        {tab === 'stockIn' && <StockInPage hideHeader={true} />}
        {tab === 'stockOut' && <StockOutPage hideHeader={true} />}
        {tab === 'physicalAudit' && <InventoryAnomalyPage mode="audit" hideHeader={true} />}
        {tab === 'anomalyWarning' && <InventoryAnomalyPage mode="alert" hideHeader={true} />}
        {tab === 'reorderList' && <SmartRestock hideHeader={true} />}
      </div>
    </div>
  );
}
