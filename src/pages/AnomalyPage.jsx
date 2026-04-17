import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function AnomalyPage() {
  const { t } = useAuth();
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    const currentStart = startDate;
    const currentEnd = endDate;
    const result = await api('GET', `/anomalies?startDate=${currentStart}&endDate=${currentEnd}`);
    setData(result?.data || result || null);
  };

  useEffect(() => { loadData(); }, [startDate, endDate]);

  const getSeverityBadge = (status) => {
    if (status === 'abnormal' || status === 'high') return <span className="badge badge-danger">{t('high')}</span>;
    if (status === 'medium') return <span className="badge badge-warning">{t('medium')}</span>;
    return <span className="badge badge-success">{t('low')}</span>;
  };

  const getStatusColor = (status) => {
    if (status === 'abnormal') return 'border-red-500 bg-red-50';
    if (status === 'warning') return 'border-orange-500 bg-orange-50';
    return 'border-green-500 bg-green-50';
  };

  const formatGap = (gap, unit) => {
    if (gap < 0) return `${Math.abs(gap).toLocaleString()} ${unit} 不足`;
    return `+${gap.toLocaleString()} ${unit}`;
  };

  return (
    <div className="page">
      <h1 className="text-xl font-bold mb-2">{t('anomalyTitle')}</h1>
      <p className="text-gray-500 text-sm mb-4">{t('anomalyDesc')}</p>

      <div className="card mb-4">
        <div className="flex gap-2">
          <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="self-center">-</span>
          <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadData} className="btn btn-primary">{t('confirm')}</button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="stat-card">
              <div className="stat-value text-red-600">{data.total || data.abnormalCount || 0}</div>
              <div className="stat-label">{t('anomaly')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-red-500">{data.high || 0}</div>
              <div className="stat-label text-red-500">{t('high')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-orange-500">{data.medium || 0}</div>
              <div className="stat-label text-orange-500">{t('medium')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-green-500">{data.low || 0}</div>
              <div className="stat-label text-green-500">{t('low')}</div>
            </div>
          </div>

          <div className="card">
            {(!data.items || !Array.isArray(data.items) || data.items.length === 0) ? (
              <p className="text-gray-400 text-sm text-center py-8">{t('noAnomaly')}</p>
            ) : (
              <div className="space-y-4">
                {data.items.map((item, i) => (
                  <div key={i} className={`p-3 rounded-lg border-l-4 ${getStatusColor(item.status)}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{item.inventoryName || 'Unknown'}</div>
                      {getSeverityBadge(item.status)}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {t('actualStock')}: {item.actualStock || 0}{item.unit} / {t('expectedUsage')}: {item.expectedUsage || 0}{item.unit}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('gapValue')}: {formatGap(item.gap || 0, item.unit || '')} ({item.gapPercent || 0}%)
                    </div>
                    {item.productBreakdown && item.productBreakdown.length > 0 && (
                      <div className="mt-2 text-[14px] text-gray-500">
                        影响产品: {item.productBreakdown.map(p => p.productName).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
