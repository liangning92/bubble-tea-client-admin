// ============ CRM (Customer Relationship Management) Hub ============
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import SubNav from '../components/SubNav';

// Sub-components
import CouponFactory from './CouponFactory';
import MarketingCampaigns from './MarketingCampaigns';
import MarketingAutomation from './MarketingAutomation'; 
import ViralEngine from './ViralEngine'; 
import WhatsAppAudit from './WhatsAppAudit'; 
import WhatsAppConnector from './WhatsAppConnector'; 
import MarketingCalendar from './MarketingCalendar';

export default function CRMHub({ mode = 'page', hideHeader }) {
  const { t, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'members';
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
 
  const tabs = [
    { key: 'members', icon: '💎' },
    { key: 'calendar', icon: '📅' },
    { key: 'automation', icon: '🤖' },
    { key: 'viral', icon: '🧬' },
    { key: 'connectivity', icon: '📱' },
    { key: 'whatsapp', icon: '📑' },
    { key: 'coupons', icon: '🎟️' },
  ];
 
  const handleTabClick = (key) => setSearchParams({ tab: key });
 
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/crm/members');
      const membersArr = Array.isArray(data) ? data : (data?.data || []);
      
      if (membersArr.length === 0) {
        setMembers([
          { id: 'v1', name: 'Jaden Santoso', phone: '081277889901', totalSpent: 750000, points: 125, lastVisit: '2026-04-09' },
          { id: 'v2', name: 'Alina Wong', phone: '082144552233', totalSpent: 125000, points: 28, lastVisit: '2026-04-10' },
          { id: 'v3', name: 'Eko Pratama', phone: '081300991122', totalSpent: 0, points: 0, lastVisit: '2026-03-15' },
        ]);
      } else {
        setMembers(membersArr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => { loadData(); }, []);
 
  const handleAddMember = async (e) => {
    e.preventDefault();
    const res = await api('POST', '/crm/members', form);
    if (!res?.error) {
      setShowAddForm(false); setForm({ name: '', phone: '' }); loadData();
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('success') }));
    }
  };
 
  const calculateRank = (spent) => {
    if (spent >= 500000) return { label: t('supreme'), class: 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' };
    if (spent >= 100000) return { label: t('goldMember'), class: 'bg-marigold text-slate-900 shadow-lg shadow-marigold/20' };
    return { label: t('basicMember'), class: 'bg-slate-100 text-slate-500' };
  };
 
  if (loading) return <div className="py-24 text-center text-label-caps animate-pulse tracking-widest text-[13px]">{t('syncingGrowthAssets')}</div>;
 
  return (
    <div className="animate-soft space-y-12 focus:outline-none text-slate-900">
      
      {/* Conditionally show header/nav based on mode and hideHeader */}
      {mode === 'page' && !hideHeader && (
        <>
          <div className="flex flex-col gap-2 px-4">
            <h1 className="text-h1 uppercase  tracking-tight">{t('marketingHub')}</h1>
            <p className="text-label-caps !text-slate-400">{t('memberAssets')}</p>
          </div>
          <div className="overflow-x-auto no-scrollbar pb-2 px-1">
            <SubNav 
              tabs={tabs.map(tData => ({ ...tData, label: t(tData.key) }))} 
              activeTab={tab} 
              onTabChange={handleTabClick} 
            />
          </div>
        </>
      )}
 
      {tab === 'members' && (
        <div className="space-y-12">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             <div className="card-premium !p-10 border-slate-50 hover:bg-slate-50/50 transition-colors">
                <p className="text-label-caps mb-4 uppercase tracking-widest">{t('totalMembers')}</p>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{members.length}</div>
             </div>
             <div className="card-premium border-red-50 !p-10 bg-red-50/10">
                <p className="text-label-caps !text-red-600 mb-4 tracking-tighter uppercase tracking-widest">{t('lapseRisks')}</p>
                <div className="text-4xl font-black text-red-700 tracking-tighter">1</div>
             </div>
             <div className="lg:col-span-2 flex justify-end items-center px-4">
                <button onClick={() => setShowAddForm(true)} className="btn-premium active !bg-slate-900 !text-white !px-12 !py-5 border-none shadow-2xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all text-sm">
                   + {t('newMember')}
                </button>
             </div>
          </div>
 
          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {members.map(m => {
               const rank = calculateRank(m.totalSpent);
               return (
                 <div key={m.id} className="card-premium group hover:border-slate-300 transition-all cursor-pointer p-0 overflow-hidden border-slate-100 bg-white">
                    <div className="p-10">
                       <div className="flex justify-between items-start mb-8">
                          <div className={`px-4 py-1.5 text-[14px] font-black uppercase tracking-widest rounded-xl ${rank.class}`}>{rank.label}</div>
                          <span className="text-slate-200 group-hover:text-slate-900 transition-colors text-xl">✎</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">{m.name}</h3>
                       <p className="text-sm font-black text-slate-400 font-mono flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                         {m.phone}
                       </p>
                       
                       <div className="mt-10 grid grid-cols-2 gap-6">
                          <div className="bg-slate-50 p-6 rounded-[32px] border border-transparent hover:border-slate-100 transition-all">
                             <p className="text-label-caps mb-2 uppercase tracking-widest">{t('spent')}</p>
                             <div className="font-black text-slate-900 text-lg">Rp {(m.totalSpent||0).toLocaleString()}</div>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-[32px] border border-transparent hover:border-slate-100 transition-all">
                             <p className="text-label-caps mb-2 uppercase tracking-widest">{t('points')}</p>
                             <div className="font-black text-orange-600 text-lg">{m.points||0}</div>
                          </div>
                       </div>
                    </div>
                    <div className="bg-slate-900 px-10 py-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                       <button className="text-[14px] font-black text-white uppercase tracking-widest hover:text-marigold transition-colors">{t('sendVoucher')}</button>
                       <button className="text-[14px] font-black text-slate-500 uppercase tracking-widest hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); api('DELETE', `/crm/members/${m.id}`).then(() => loadData()); }}>{t('purge')}</button>
                    </div>
                 </div>
               );
            })}
          </div>
        </div>
      )}
 
      {/* Render Other Tabs if not in simple mode */}
      <div className="min-h-[40vh]">
        {tab === 'calendar' && <MarketingCalendar hideHeader={true} />}
        {tab === 'automation' && <MarketingAutomation hideHeader={true} />}
        {tab === 'viral' && <ViralEngine hideHeader={true} />}
        {tab === 'connectivity' && <WhatsAppConnector hideHeader={true} />}
        {tab === 'whatsapp' && <WhatsAppAudit hideHeader={true} />}
        {tab === 'coupons' && <CouponFactory hideHeader={true} />}
      </div>
 
      {/* Add Form Portal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-soft">
           <div className="card-premium w-full max-w-md m-0 shadow-2xl animate-soft !p-12 border-none">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-10">{t('quickAddMember')}</h3>
              <form onSubmit={handleAddMember} className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-label-caps block pl-1 uppercase tracking-widest">{t('phoneNumber')}</label>
                    <input className="input-premium w-full font-mono text-xl !p-6" placeholder="08XXXXXXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                 </div>
                 <div className="space-y-4">
                    <label className="text-label-caps block pl-1 uppercase tracking-widest">{t('memberName')}</label>
                    <input className="input-premium w-full font-black text-xl !p-6" placeholder="NAME" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                 </div>
                 <div className="flex gap-4 pt-8">
                    <button type="submit" className="btn-premium active !bg-slate-900 !text-white px-10 py-6 flex-2 border-none shadow-xl shadow-slate-900/10 text-sm">{t('confirmEntry')}</button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-10 py-6 bg-slate-100 text-slate-500 font-black text-[14px] uppercase tracking-widest rounded-[28px] flex-1 hover:bg-slate-200 transition-all">{t('cancel')}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
