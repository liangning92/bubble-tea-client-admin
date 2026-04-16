import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function ReportPage() {
  const { t } = useAuth();
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    const data = await api('GET', '/report/daily?date=' + date);
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, [date]);

  return (
    <div className="page">
      <h1 className="text-xl font-bold mb-6">{t.reportTitle}</h1>

      <div className="card mb-4">
        <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {loading ? <div className="loading">{t.loading}</div> : report && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">{t.dailyReport}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">Rp{report.summary?.revenue || 0}</div>
                <div className="text-[14px] text-gray-500">{t.revenue}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">Rp{report.summary?.netProfit || 0}</div>
                <div className="text-[14px] text-gray-500">{t.netProfit}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{report.summary?.totalSales || 0}</div>
                <div className="text-[14px] text-gray-500">{t.totalSales}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{report.summary?.topProducts?.[0]?.name?.slice(0, 4) || '-'}</div>
                <div className="text-[14px] text-gray-500">{t.topProduct}</div>
              </div>
            </div>
          </div>

          {report.summary?.topProducts?.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-3">{t.topProducts}</h3>
              <div className="space-y-4">
                {report.summary.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-center font-bold text-sm">{i+1}</span>
                    <span className="flex-1">{p.name}</span>
                    <span className="badge badge-success">{p.quantity}{t.cup}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.alerts?.lowStock?.length > 0 && (
            <div className="card border-l-4 border-red-500">
              <h3 className="font-bold text-red-600 mb-3">{t.inventoryAlert}</h3>
              <div className="space-y-4">
                {report.alerts.lowStock.map((item, i) => (
                  <div key={i} className="text-sm text-red-600">
                    {item.name}: {item.current}{item.unit} (安全: {item.safe}{item.unit})
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.suggestions?.length > 0 && (
            <div className="card border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-600 mb-3">{t.restockSuggestion}</h3>
              <div className="space-y-4">
                {report.suggestions.map((s, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{s.ingredient}</span>:
                    {t.lang === 'zh'
                      ? ` 建议订购 ${s.suggested}${s.unit} (当前: ${s.current}${s.unit})`
                      : ` Saran pesan ${s.suggested}${s.unit} (Saat ini: ${s.current}${s.unit})`
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
