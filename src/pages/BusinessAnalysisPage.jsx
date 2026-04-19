import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function BusinessAnalysisPage() {
    const { lang, t } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ 
        revenue: 0, 
        orders: 0, 
        avgOrder: 0, 
        topProducts: [], 
        hourDist: [], 
        categoryBreakdown: [], 
        trend: [] 
    });
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch both revenue stats and sales breakdown
            const [breakdownRes, revenueRes] = await Promise.all([
                api('GET', `/analysis/sales/breakdown?startDate=${dateRange.start}&endDate=${dateRange.end}`),
                api('GET', `/sales?startDate=${dateRange.start}&endDate=${dateRange.end}`)
            ]);

            const salesArr = Array.isArray(revenueRes) ? revenueRes : (revenueRes?.data || []);
            const rev = salesArr.reduce((sum, s) => sum + (s.quantity * (s.unitPrice || 0)), 0);

            setData({
                ...breakdownRes,
                revenue: rev,
                orders: salesArr.length,
                avgOrder: salesArr.length > 0 ? Math.round(rev / salesArr.length) : 0,
                // Top products logic from revenue page
                topProducts: breakdownRes.categoryBreakdown?.slice(0, 10) || []
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [dateRange]);

    const formatCurrency = (num) => `Rp ${num.toLocaleString()}`;
    const maxHourCount = Math.max(...(data?.hourDist || []).map(h => h.count || 0), 1);
    const maxCatRev = Math.max(...(data?.categoryBreakdown || []).map(c => c.revenue || 0), 1);

    if (loading) return (
        <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-[14px] font-black text-blue-400 animate-pulse tracking-[0.4em] uppercase">Processing Business Intelligence...</div>
        </div>
    );

    return (
        <div className="space-y-5 animate-soft text-slate-900">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-h1">{t('businessAnalysisTitle')}</h2>
                    <p className="text-label-caps mt-1">{t('bizAnalysisCorePerformance')}</p>
                </div>
                <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        className="bg-white border-none rounded-xl px-4 py-3 text-[14px] font-black text-slate-900 outline-none shadow-sm"
                    />
                    <span className="text-[14px] font-black text-slate-400">→</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        className="bg-white border-none rounded-xl px-4 py-3 text-[14px] font-black text-slate-900 outline-none shadow-sm"
                    />
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium border-blue-100/30">
                    <p className="text-label-caps mb-4">{t('totalRevenue')}</p>
                    <div className="text-3xl font-black text-blue-600 tracking-tighter">{formatCurrency(data.revenue)}</div>
                </div>
                <div className="card-premium">
                    <p className="text-label-caps mb-4">{t('totalOrders')}</p>
                    <div className="text-3xl font-black text-slate-900 tracking-tighter">{data.orders} <span className="text-[14px] text-slate-400">Order</span></div>
                </div>
                <div className="card-premium">
                    <p className="text-label-caps mb-4">{t('avgOrder')}</p>
                    <div className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(data.avgOrder)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Hourly peak */}
                <div className="card-premium border-slate-200 !p-6 bg-white">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-h2">🕒 {t('peakHours')}</h3>
                            <p className="text-label-caps mt-1">{t('orderDensityMatrix')}</p>
                        </div>
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[14px] font-black rounded-xl border border-blue-100 uppercase tracking-widest">{t('liveFlow')}</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-48 gap-1.5 px-4">
                        {(data?.hourDist || []).map(h => (
                            <div key={h.hour} className="group relative flex-1 flex flex-col items-center">
                                <div
                                    style={{ height: `${((h.count || 0) / maxHourCount) * 100}%` }}
                                    className="w-full bg-slate-200 group-hover:bg-blue-600 rounded-t-lg transition-all duration-500 relative"
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[14px] font-black py-1 px-4 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                                        {h.count}
                                    </div>
                                </div>
                                <span className="text-[8px] mt-3 font-black text-slate-400 group-hover:text-blue-600">{h.hour}h</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="card-premium border-slate-200 !p-6 bg-white">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-h2">📦 {t('productPerformance')}</h3>
                            <p className="text-label-caps mt-1">{t('revenueContribution')}</p>
                        </div>
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[14px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">{t('profitable')}</span>
                    </div>

                    <div className="space-y-4">
                        {(data?.categoryBreakdown || []).slice(0, 6).map(c => (
                            <div key={c.category} className="space-y-4 group">
                                <div className="flex justify-between items-end">
                                    <span className="text-[14px] font-black text-slate-800 uppercase tracking-widest">{c.category}</span>
                                    <span className="text-sm font-black text-slate-900">{formatCurrency(c.revenue)}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                    <div
                                        style={{ width: `${((c.revenue || 0) / maxCatRev) * 100}%` }}
                                        className="h-full bg-blue-400 group-hover:bg-blue-600 transition-all duration-700"
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Advisor placeholder */}
            <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 flex items-center gap-6">
                <span className="text-3xl">💡</span>
                <p className="text-body font-bold  tracking-tight">
                    {t('lunchPeakInsight')}
                </p>
            </div>
        </div>
    );
}
