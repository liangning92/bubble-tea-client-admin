import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function BacktrackPage() {
  const { t } = useAuth();
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    const result = await api('GET', `/backtrack/consumption?startDate=${startDate}&endDate=${endDate}`);
    setData(result);
  };

  useEffect(() => { loadData(); }, []);

  const getDiffColor = (diff) => {
    if (diff > 5) return 'text-green-600';
    if (diff < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="page">
      <h1 className="text-xl font-bold mb-2">{t.backtrackTitle}</h1>
      <p className="text-gray-500 text-sm mb-4">{t.backtrackDesc}</p>

      <div className="card mb-4">
        <div className="flex gap-2">
          <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="self-center">-</span>
          <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadData} className="btn btn-primary">{t.confirm}</button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="stat-card">
              <div className="stat-value">{data.summary.totalExpected}</div>
              <div className="stat-label">{t.expectedCups}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.summary.totalActual}</div>
              <div className="stat-label">{t.actualCups}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.summary.anomalyCount}</div>
              <div className="stat-label">{t.anomaly}</div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-3">{t.consumptionAnalysis}</h3>
            {data.products.length === 0 ? (
              <p className="text-gray-400 text-sm">{t.noData}</p>
            ) : (
              <div className="space-y-4">
                {data.products.map((p, i) => (
                  <div key={i} className={`p-3 rounded-lg ${p.hasAnomaly ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{p.productName}</div>
                      {p.hasAnomaly && <span className="badge badge-danger">{t.anomaly}</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm mb-2">
                      <div>
                        <div className="text-[14px] text-gray-500">{t.expectedCups}</div>
                        <div className="font-medium">{p.expectedCups}{t.cup}</div>
                      </div>
                      <div>
                        <div className="text-[14px] text-gray-500">{t.actualCups}</div>
                        <div className="font-medium">{p.actualCups}{t.cup}</div>
                      </div>
                      <div>
                        <div className="text-[14px] text-gray-500">{t.difference}</div>
                        <div className={`font-medium ${getDiffColor(p.difference)}`}>{p.difference > 0 ? '+' : ''}{p.difference}{t.cup}</div>
                      </div>
                      <div>
                        <div className="text-[14px] text-gray-500">{t.diffPercent}</div>
                        <div className={`font-medium ${getDiffColor(p.differencePercent)}`}>{p.differencePercent > 0 ? '+' : ''}{p.differencePercent}%</div>
                      </div>
                    </div>
                    {p.possibleCause && (
                      <div className="text-[14px] text-gray-600 bg-white p-2 rounded">
                        💡 {p.possibleCause}
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
