import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function TaxReporter({ hideHeader }) {
  const { t, lang } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // NPWP config
  const [storeInfo, setStoreInfo] = useState({
    name: '',
    address: '',
    taxId: ''
  });

  // PB1 calculation
  const [calcResult, setCalcResult] = useState(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [grossTurnover, setGrossTurnover] = useState('');

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [npwpRes, pb1Res] = await Promise.all([
        api('GET', '/tax/npwp').catch(() => null),
        api('GET', `/tax/pb1/calculate?month=${month}`).catch(() => null)
      ]);

      if (npwpRes && !npwpRes.error) {
        setStoreInfo({
          name: npwpRes.businessName || npwpRes.storeName || '',
          address: npwpRes.address || '',
          taxId: npwpRes.npwp || ''
        });
      }

      if (pb1Res && !pb1Res.error) {
        setCalcResult(pb1Res);
        if (pb1Res.grossTurnover) setGrossTurnover(String(pb1Res.grossTurnover));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Save NPWP
  const handleSaveNpwp = async () => {
    setSaving(true);
    try {
      const res = await api('PUT', '/tax/npwp', {
        businessName: storeInfo.name,
        address: storeInfo.address,
        npwp: storeInfo.taxId
      });
      if (res && !res.error) {
        // success - could show toast
      }
    } finally {
      setSaving(false);
    }
  };

  // Calculate PB1
  const handleCalculate = async () => {
    if (!grossTurnover || isNaN(parseFloat(grossTurnover))) return;
    setCalculating(true);
    try {
      const res = await api('GET', `/tax/pb1/calculate?month=${month}&grossTurnover=${grossTurnover}`).catch(() => null);
      if (res && !res.error) {
        setCalcResult(res);
      }
    } finally {
      setCalculating(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = () => {
    window.open(`/api/profit/report/pdf?month=${month}`, '_blank');
  };

  const formatCurrency = (num) => (
    <span className="font-mono">{(num || 0).toLocaleString()}</span>
  );

  if (loading) return (
    <div className="py-24 text-center">
      <div className="text-[14px] animate-pulse text-slate-900 font-black tracking-[0.4em] uppercase">{t('generatingRegulatory')}</div>
    </div>
  );

  const taxRate = calcResult?.taxRate || 10;
  const taxAmount = calcResult?.taxAmount || calcResult?.totalTaxPayable || 0;

  return (
    <div className="space-y-6 animate-soft text-slate-900 pb-24">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
          <div className="space-y-4.5">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{t('taxHub')}</h3>
            <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60 leading-none">{t('taxSubtitle')}</p>
          </div>
          <button onClick={handleDownloadPdf} className="btn-premium active !bg-[#FF7700] !text-white !px-12 !py-3 !text-[13px] border-none shadow-2xl shadow-orange-500/20 !scale-100 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] font-black rounded-[24px]">
            📄 {t('downloadPdfReport') || '下载税务PDF'}
          </button>
        </div>
      )}

      {/* NPWP + PB1 two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: NPWP Config */}
        <div className="card-premium border-slate-50 space-y-6 !p-6 transition-all hover:border-slate-300 bg-white shadow-sm !rounded-2xl group/ident relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-40 group-hover/ident:scale-150 transition-transform duration-1000" />
          <div className="flex items-center gap-6 border-b border-slate-50 pb-8 relative z-10">
            <span className="text-3xl shrink-0">🏛️</span>
            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              {t('merchantIdentity')}
              <span className="w-12 h-px bg-slate-200"></span>
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-6 relative z-10">
            <div className="space-y-4">
              <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('storeNameLabel')}</label>
              <input className="input-premium w-full !bg-slate-50 focus:!bg-white border-none !rounded-xl !p-6 font-black text-[16px] shadow-inner"
                value={storeInfo.name} onChange={e => setStoreInfo(p => ({ ...p, name: e.target.value }))} placeholder={t('placeholderStoreName')} />
            </div>
            <div className="space-y-4">
              <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('merchantAddressLabel')}</label>
              <input className="input-premium w-full !bg-slate-50 focus:!bg-white border-none !rounded-xl !p-6 font-black text-[16px] shadow-inner"
                value={storeInfo.address} onChange={e => setStoreInfo(p => ({ ...p, address: e.target.value }))} placeholder={t('placeholderStoreAddress')} />
            </div>
            <div className="space-y-4">
              <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('taxpayerIdLabel')}</label>
              <input className="input-premium w-full !bg-slate-50 focus:!bg-white font-mono tracking-[0.2em] text-slate-900 border-none !rounded-xl !p-6 font-black text-[16px] shadow-inner"
                value={storeInfo.taxId} onChange={e => setStoreInfo(p => ({ ...p, taxId: e.target.value }))}
                placeholder={t('taxIdPlaceholder') || 'XX.XXX.XXX.X-XXX.XXX'} />
            </div>
          </div>

          <div className="pt-8 relative z-10">
            <button onClick={handleSaveNpwp} disabled={saving} className="text-[14px] font-black text-white uppercase tracking-widest hover:bg-[#FF7700] hover:text-white px-10 py-3 bg-slate-900 rounded-full border border-slate-100 transition-all underline decoration-slate-700 decoration-4 underline-offset-8 disabled:opacity-50">
              {saving ? (t('processingDatabase') || '处理中...') : (t('updateLockHeader') || '更新并锁定')}
            </button>
          </div>
        </div>

        {/* Right: PB1 Calculation */}
        <div className="card-premium border-none bg-slate-900 text-white space-y-6 shadow-3xl !p-6 relative overflow-hidden group/audit !rounded-3xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[140px] -mr-64 -mt-64 transition-transform group-hover/audit:scale-125 duration-1000" />

          <div className="flex items-center gap-6 border-b border-white/5 pb-8 relative z-10">
            <span className="text-3xl shrink-0">📊</span>
            <h4 className="text-2xl text-slate-400 font-black uppercase tracking-tighter flex items-center gap-4">
              {t('taxAuditTitle')}
              <span className="w-12 h-px bg-slate-800"></span>
            </h4>
          </div>

          <div className="space-y-4 relative z-10">
            {/* Month selector */}
            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest">{t('filingMonthLabel')}</label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="w-full !bg-white/10 !text-white !rounded-[20px] !p-5 font-black text-[15px] border border-white/10" />
            </div>

            {/* Gross turnover input */}
            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest">{t('grossTurnover')}</label>
              <div className="flex gap-3">
                <input type="number" value={grossTurnover} onChange={e => setGrossTurnover(e.target.value)} placeholder="0"
                  className="flex-1 !bg-white/10 !text-white !rounded-[20px] !p-5 font-mono text-[16px] border border-white/10" />
                <button onClick={handleCalculate} disabled={calculating || !grossTurnover}
                  className="btn-premium active !bg-[#FF7700] !text-white !px-8 !py-5 border-none !rounded-[20px] text-[13px] font-black uppercase tracking-widest disabled:opacity-40 active:scale-95">
                  {calculating ? '...' : '计算'}
                </button>
              </div>
            </div>

            {/* Tax rate */}
            <div className="flex justify-between items-end border-b border-white/5 pb-10">
              <div className="space-y-4">
                <p className="text-[14px] text-slate-600 font-black tracking-[0.3em] uppercase opacity-60">{t('grossTurnover')}</p>
                <p className="text-3xl font-black text-white tracking-tighter font-mono">
                  <span className="text-lg text-slate-600 mr-2 font-black">Rp</span>
                  {formatCurrency(calcResult?.grossTurnover || parseFloat(grossTurnover) || 0)}
                </p>
              </div>
              <div className="text-right space-y-4">
                <p className="text-[14px] text-slate-600 font-black tracking-[0.3em] uppercase opacity-60">{t('taxRateLabel')}</p>
                <p className="text-4xl font-black text-emerald-400 font-mono opacity-80">{taxRate}%</p>
              </div>
            </div>

            {/* Tax amount */}
            <div className="py-14 bg-white/5 rounded-[40px] border border-white/10 px-10 shadow-inner group/amount relative overflow-hidden">
              <p className="text-[13px] text-slate-500 mb-6 font-black uppercase tracking-[0.4em] opacity-80">{t('totalTaxPayable')}</p>
              <p className="text-6xl font-black tracking-tighter text-white relative z-10">
                <span className="text-2xl text-emerald-500 mr-4 font-black tracking-normal">Rp</span>
                {formatCurrency(taxAmount)}
              </p>
            </div>

            {/* Compliance badges */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 p-6 rounded-[28px] border border-white/10 flex flex-col justify-center gap-2">
                <span className="text-[12px] text-slate-600 font-black uppercase tracking-[0.3em]">{t('billingCycle')}</span>
                <span className="text-[15px] text-white font-black uppercase tracking-tight">{t('fullCalendarMonth')}</span>
              </div>
              <div className="bg-white/5 p-6 rounded-[28px] border border-white/10 flex flex-col justify-center gap-2">
                <span className="text-[12px] text-slate-600 font-black uppercase tracking-[0.3em]">{t('complianceCode')}</span>
                <span className="text-[15px] text-emerald-400 font-black uppercase tracking-tight underline decoration-emerald-900 decoration-3 underline-offset-4">{t('complianceStatus')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance notice */}
      <div className="card-premium border-slate-50 bg-white !p-6 hover:border-slate-300 transition-all shadow-sm !rounded-3xl relative overflow-hidden group/notice">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-60 transition-transform group-hover/notice:scale-125 duration-1000" />
        <div className="flex flex-col xl:flex-row gap-12 items-center relative z-10">
          <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center text-5xl shadow-xl border border-slate-50 group-hover/notice:rotate-12 transition-transform relative z-10 shadow-inner shrink-0">📜</div>
          <div className="flex-1 space-y-4 text-center xl:text-left">
            <h4 className="font-black text-slate-900 uppercase tracking-tighter text-2xl underline decoration-emerald-500 decoration-6 underline-offset-8">{t('complianceNoticeTitle')}</h4>
            <p className="text-[15px] text-slate-400 font-bold leading-relaxed max-w-3xl uppercase tracking-tight opacity-70">
              {t('complianceNoticeDesc')}
            </p>
          </div>
          <button onClick={handleDownloadPdf} className="w-full xl:w-auto btn-premium active !bg-slate-900 !text-white !h-11 border-none text-[14px] font-black tracking-[0.3em] uppercase !rounded-[28px] shadow-2xl shadow-slate-900/10 !scale-100 hover:scale-105 active:scale-95 transition-all xl:px-16">
            {t('lockExportPdf')}
          </button>
        </div>
      </div>
    </div>
  );
}
