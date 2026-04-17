import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubNav from '../components/SubNav';

// Sub-pages
import StoreSettingsPage from './StoreSettingsPage';
import PermissionMatrix from './PermissionMatrix';
import SupplierManagement from './SupplierManagement';
import POSHardwareConfig from './POSHardwareConfig';
import POSSettingsPage from './POSSettingsPage';

export default function SettingsHub() {
  const { t } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = [
    { key: 'profile', label: t('tabProfile'), icon: '🏪' },
    { key: 'suppliers', label: t('tabSuppliers'), icon: '🚛' },
    { key: 'pos', label: t('tabPOS'), icon: '🖥️' },
    { key: 'posSettings', label: t('tabPOSSettings') || 'POS设置', icon: '⚙️' },
    { key: 'rbac', label: t('tabSecurity'), icon: '🛡️' },
    { key: 'system', label: t('tabSystem'), icon: '⚙️' },
  ];

  let tab = searchParams.get('tab') || 'profile';
  if (!tabs.find(t => t.key === tab)) tab = 'profile';

  const handleTabChange = (key) => setSearchParams({ tab: key });

  return (
    <div className="animate-soft space-y-12 focus:outline-none text-slate-900 pb-12">
      <div className="flex flex-col gap-2 px-4">
        <h1 className="text-h1 uppercase  tracking-tight">
          {t('settingsHubTitle')}
        </h1>
        <p className="text-label-caps !text-slate-400">
          {t('settingsHubSubtitle')}
        </p>
      </div>

      {/* 统一二级导航 */}
      <div className="overflow-x-auto no-scrollbar pb-2 px-1">
        <SubNav 
          tabs={tabs} 
          activeTab={tab} 
          onTabChange={handleTabChange} 
        />
      </div>

      {/* 内容区域 */}
      <div className="min-h-[70vh] bg-white rounded-[48px] p-12 border border-slate-50 shadow-sm relative overflow-hidden transition-all hover:border-slate-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50/50 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10">
          {tab === 'profile' && <StoreSettingsPage />}
          {tab === 'suppliers' && <SupplierManagement />}
          {tab === 'pos' && <POSHardwareConfig />}
          {tab === 'posSettings' && <POSSettingsPage />}
          {tab === 'rbac' && <PermissionMatrix />}
          {tab === 'system' && <SystemGeneralSettings />}
        </div>
      </div>
    </div>
  );
}

function SystemGeneralSettings() {
  const { t } = useAuth();
  return (
    <div className="space-y-12 animate-soft text-slate-900">
       <div className="flex flex-col md:flex-row justify-end items-center gap-6">
          <button className="w-full md:w-auto btn-premium active !bg-slate-900 !text-white !px-12 !h-16 border-none shadow-3xl shadow-slate-900/10 text-[14px] font-black uppercase tracking-widest  rounded-[20px] transition-all hover:scale-105 active:scale-95">
             {t('saveGlobalChanges')}
          </button>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="card-premium border-slate-50 !p-10 space-y-10 text-slate-900 bg-slate-50/30 !rounded-[32px] hover:border-slate-200 transition-all">
             <h4 className="text-xl font-black border-b border-slate-100 pb-6  tracking-tight uppercase">
               {t('localizationTitle')}
             </h4>
             <div className="space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                   <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('defaultInterfaceLabel')}</span>
                   <select className="input-premium !py-3 !px-4 w-56 font-black text-slate-900 bg-slate-50 border-none appearance-none cursor-pointer hover:bg-slate-100 transition-all rounded-xl  uppercase text-[13px]">
                      <option>简体中文 (ZH)</option>
                      <option>English (EN)</option>
                      <option>Bahasa Indonesia (ID)</option>
                   </select>
                </div>
                <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                   <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('currencyFormatLabel')}</span>
                   <input className="input-premium !py-3 !px-4 w-56 font-black text-slate-900 bg-slate-50 border-none rounded-xl  uppercase text-[15px] shadow-inner" defaultValue="Rp" />
                </div>
             </div>
          </div>

          <div className="card-premium border-slate-50 !p-10 space-y-10 text-slate-900 bg-slate-50/30 !rounded-[32px] hover:border-slate-200 transition-all">
             <h4 className="text-xl font-black border-b border-slate-100 pb-6  tracking-tight uppercase">
               {t('securityAuditTitle')}
             </h4>
             <div className="space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                   <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">Force 2FA for Admin</span>
                   <div className="w-14 h-7 bg-slate-900 rounded-full relative cursor-pointer shadow-lg shadow-slate-900/10"><div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm" /></div>
                </div>
                <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                   <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">Session Timeout</span>
                   <span className="text-[13px] font-black text-slate-900 tracking-tight pr-4  uppercase">24 Hours (Persistent)</span>
                </div>
             </div>
          </div>
       </div>

       <div className="p-12 rounded-[48px] border-2 border-dashed border-slate-200 flex flex-col md:flex-row gap-10 items-center bg-slate-50/50 hover:bg-white transition-all hover:border-slate-400 group">
          <div className="w-20 h-20 bg-white rounded-[24px] shadow-2xl shadow-slate-900/5 border border-slate-100 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">⚠️</div>
          <div className="flex-1 space-y-4">
             <h4 className="text-[15px] font-black text-slate-900 uppercase tracking-widest ">
               {t('criticalActionNoticeTitle')}
             </h4>
             <p className="text-[14px] text-slate-500 font-bold leading-relaxed  uppercase tracking-tight opacity-70">
               {t('criticalActionNoticeDesc')}
             </p>
          </div>
       </div>
    </div>
  );
}
