import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

// ============ 报表导出页面 P012 ============
export default function ReportExportPage() {
  const { t, lang } = useAuth();
  const [reportType, setReportType] = useState('profit'); // profit/cost/revenue
  const [periodType, setPeriodType] = useState('daily'); // daily/monthly/yearly
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportFormat, setExportFormat] = useState('excel'); // excel/pdf
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [year, setYear] = useState(() => new Date().getFullYear().toString());

  // 加载预览数据
  const loadPreview = async () => {
    setLoading(true);
    try {
      let data = null;
      if (reportType === 'profit') {
        if (periodType === 'daily') {
          data = await api('GET', `/profit/daily?date=${startDate}`);
        } else if (periodType === 'monthly') {
          data = await api('GET', `/profit/monthly?month=${month}`);
        } else {
          data = await api('GET', `/profit/yearly?year=${year}`);
        }
      } else if (reportType === 'cost') {
        data = await api('GET', `/cost-summary?startDate=${startDate}&endDate=${endDate}`);
      } else if (reportType === 'revenue') {
        data = await api('GET', `/sales?startDate=${startDate}&endDate=${endDate}`);
      }
      setPreviewData(data);
    } catch (e) {
      console.error('Load preview failed:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPreview();
  }, [reportType, periodType, startDate, endDate, month, year]);

  // 导出报表
  const handleExport = async () => {
    setLoading(true);
    try {
      if (exportFormat === 'excel') {
        await exportExcel();
      } else {
        await exportPdf();
      }
    } catch (e) {
      alert(t('exportFailed'));
      console.error(e);
    }
    setLoading(false);
  };

  // Excel导出
  const exportExcel = async () => {
    // 构建CSV格式的Excel文件
    let csvContent = '';
    
    if (reportType === 'profit') {
      csvContent = generateProfitCSV();
    } else if (reportType === 'cost') {
      csvContent = generateCostCSV();
    } else if (reportType === 'revenue') {
      csvContent = generateRevenueCSV();
    }

    // 添加BOM支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${reportType}_${periodType}_${startDate}_${endDate}.csv`);
  };

  // PDF导出 - 使用后端API生成真实PDF（仅支持月度利润报表）
  const exportPdf = async () => {
    if (reportType === 'profit' && periodType === 'monthly') {
      // 使用后端API生成真实PDF
      window.open(`/api/profit/report/pdf?month=${month}`, '_blank');
    } else {
      // 前端打印方式兜底
      const printWindow = window.open('', '_blank');
      const html = generatePrintHTML();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => { printWindow.print(); };
    }
  };

  // 生成利润报表CSV
  const generateProfitCSV = () => {
    const headers = ['报表类型', '日期', '总收入', '总成本', '净利润', '利润率'];
    const rows = [];
    
    if (previewData) {
      if (periodType === 'daily') {
        rows.push([
          t('profitReport') || '利润报表',
          startDate,
          previewData.totalRevenue || 0,
          previewData.totalCost || 0,
          previewData.netProfit || 0,
          previewData.totalRevenue > 0 ? ((previewData.netProfit / previewData.totalRevenue) * 100).toFixed(2) + '%' : '0%'
        ]);
      } else if (periodType === 'monthly') {
        rows.push([
          t('monthlyProfit') || '月利润报表',
          month,
          previewData.totalRevenue || 0,
          previewData.totalCost || 0,
          previewData.netProfit || 0,
          previewData.totalRevenue > 0 ? ((previewData.netProfit / previewData.totalRevenue) * 100).toFixed(2) + '%' : '0%'
        ]);
      } else {
        rows.push([
          t('yearlyProfit') || '年利润报表',
          year,
          previewData.totalRevenue || 0,
          previewData.totalCost || 0,
          previewData.netProfit || 0,
          previewData.totalRevenue > 0 ? ((previewData.netProfit / previewData.totalRevenue) * 100).toFixed(2) + '%' : '0%'
        ]);
      }
    }

    // 产品明细
    if (previewData?.products?.length > 0) {
      rows.push([]);
      rows.push([t('productDetails') || '产品明细']);
      rows.push([t('product') || '产品', t('quantity') || '数量', t('revenue') || '销售额', t('cost') || '成本', t('profit') || '利润']);
      previewData.products.forEach(p => {
        rows.push([p.name, p.quantity, p.revenue, p.cost, p.profit]);
      });
    }

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // 生成成本报表CSV
  const generateCostCSV = () => {
    const headers = ['成本类型', '金额', '备注'];
    const rows = [];

    if (previewData) {
      const fixed = previewData.fixedCosts || {};
      const variable = previewData.variableCosts || {};
      const other = previewData.otherCosts || {};

      rows.push([t('fixedCost') || '固定成本']);
      if (fixed.rent) rows.push(['房租', fixed.rent]);
      if (fixed.utilities) rows.push(['水电', fixed.utilities]);
      if (fixed.tax) rows.push(['税费', fixed.tax]);
      if (fixed.labor) rows.push(['人工', fixed.labor]);

      rows.push([]);
      rows.push([t('variableCost') || '变动成本']);
      if (variable.marketing) rows.push(['营销', variable.marketing]);
      if (variable.raw_material) rows.push(['原料', variable.raw_material]);

      rows.push([]);
      rows.push([t('otherCost') || '其他成本']);
      if (other.other) rows.push(['其他', other.other]);

      rows.push([]);
      rows.push([t('total') || '合计', previewData.total || 0]);
    }

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // 生成营收报表CSV
  const generateRevenueCSV = () => {
    const headers = [t('date') || '日期', t('order') || '订单号', t('product') || '产品', t('quantity') || '数量', t('amount') || '金额'];
    const rows = [];

    if (previewData?.sales) {
      previewData.sales.forEach(s => {
        rows.push([s.date, s.id, s.productName, s.quantity, s.totalPrice]);
      });
    }

    if (previewData?.summary) {
      rows.push([]);
      rows.push([t('totalRevenue') || '总营业额', '', '', '', previewData.summary.totalRevenue]);
      rows.push([t('orderCount') || '订单数', '', '', '', previewData.summary.totalOrders]);
      rows.push([t('avgOrder') || '客单价', '', '', '', previewData.summary.avgOrderValue]);
    }

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // 下载blob文件
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 生成打印HTML
  const generatePrintHTML = () => {
    const title = reportType === 'profit' ? (t('profitReport') || '利润报表') : 
                  reportType === 'cost' ? (t('costReport') || '成本报表') : (t('revenueReport') || '营收报表');
    const periodTitle = periodType === 'daily' ? startDate : 
                        periodType === 'monthly' ? month : year;

    let content = '';
    if (reportType === 'profit' && previewData) {
      content = `
        <h2>${t('profitReport') || '利润报表'}</h2>
        <p>${periodTitle}</p>
        <table>
          <tr><th>${t('revenue') || '收入'}</th><td>Rp${previewData.totalRevenue || 0}</td></tr>
          <tr><th>${t('cost') || '成本'}</th><td>Rp${previewData.totalCost || 0}</td></tr>
          <tr><th>${t('netProfit') || '净利润'}</th><td>Rp${previewData.netProfit || 0}</td></tr>
          <tr><th>${t('profitMargin') || '利润率'}</th>
            <td>${previewData.totalRevenue > 0 ? ((previewData.netProfit / previewData.totalRevenue) * 100).toFixed(2) : 0}%</td>
          </tr>
        </table>
      `;
    } else if (reportType === 'cost' && previewData) {
      content = `
        <h2>${t('costReport') || '成本报表'}</h2>
        <p>${startDate} - ${endDate}</p>
        <table>
          <tr><th>${t('fixedCost') || '固定成本'}</th><td>Rp${previewData.fixedTotal || 0}</td></tr>
          <tr><th>${t('variableCost') || '变动成本'}</th><td>Rp${previewData.variableTotal || 0}</td></tr>
          <tr><th>${t('total') || '合计'}</th><td>Rp${previewData.total || 0}</td></tr>
        </table>
      `;
    } else if (reportType === 'revenue' && previewData) {
      content = `
        <h2>${t('revenueReport') || '营收报表'}</h2>
        <p>${startDate} - ${endDate}</p>
        <table>
          <tr><th>${t('totalRevenue') || '总营业额'}</th><td>Rp${previewData.summary?.totalRevenue || 0}</td></tr>
          <tr><th>${t('orderCount') || '订单数'}</th><td>${previewData.summary?.totalOrders || 0}</td></tr>
          <tr><th>${t('avgOrder') || '客单价'}</th><td>Rp${previewData.summary?.avgOrderValue || 0}</td></tr>
        </table>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          h2 { color: #666; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>🧋 ${title}</h1>
        ${content}
        <hr/>
        <p style="color:#999;font-size:12px;">
          ${t('generatedAt') || '生成时间'}: ${new Date().toLocaleString()}
        </p>
      </body>
      </html>
    `;
  };

  // 格式化金额
  const formatCurrency = (amount) => {
    return 'Rp' + (amount || 0).toLocaleString();
  };

  return (
    <div className="page">
      <h1 className="text-xl font-bold mb-6">📊 {t('reportExport') || '报表导出'}</h1>

      {/* 报表类型选择 */}
      <div className="card mb-4">
        <h3 className="font-bold mb-3">{t('reportType') || '报表类型'}</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            className={`btn ${reportType === 'profit' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setReportType('profit')}
          >
            📈 {t('profit') || '利润报表'}
          </button>
          <button
            className={`btn ${reportType === 'cost' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setReportType('cost')}
          >
            💸 {t('costReport') || '成本报表'}
          </button>
          <button
            className={`btn ${reportType === 'revenue' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setReportType('revenue')}
          >
            💰 {t('revenueReport') || '营收报表'}
          </button>
        </div>
      </div>

      {/* 时间周期选择 */}
      <div className="card mb-4">
        <h3 className="font-bold mb-3">{t('period') || '时间周期'}</h3>
        <div className="flex gap-2 flex-wrap mb-3">
          <button
            className={`btn ${periodType === 'daily' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPeriodType('daily')}
          >
            {t('daily') || '日报'}
          </button>
          <button
            className={`btn ${periodType === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPeriodType('monthly')}
          >
            {t('monthly') || '月报'}
          </button>
          <button
            className={`btn ${periodType === 'yearly' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPeriodType('yearly')}
          >
            {t('yearly') || '年报'}
          </button>
        </div>

        {/* 日期选择 */}
        {periodType === 'daily' && (
          <div className="flex gap-2 items-center">
            <label>{t('date') || '日期'}:</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
        )}

        {periodType === 'monthly' && (
          <div className="flex gap-2 items-center">
            <label>{t('month') || '月份'}:</label>
            <input
              type="month"
              className="input"
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
          </div>
        )}

        {periodType === 'yearly' && (
          <div className="flex gap-2 items-center">
            <label>{t('year') || '年份'}:</label>
            <input
              type="number"
              className="input w-32"
              value={year}
              onChange={e => setYear(e.target.value)}
              min="2020"
              max="2030"
            />
          </div>
        )}

        {(periodType === 'cost' || periodType === 'revenue') && (
          <div className="flex gap-4 items-center mt-3">
            <div className="flex gap-2 items-center">
              <label>{t('startDate') || '开始'}:</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <label>{t('endDate') || '结束'}:</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 导出格式选择 */}
      <div className="card mb-4">
        <h3 className="font-bold mb-3">{t('exportFormat') || '导出格式'}</h3>
        <div className="flex gap-2">
          <button
            className={`btn ${exportFormat === 'excel' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setExportFormat('excel')}
          >
            📑 Excel (CSV)
          </button>
          <button
            className={`btn ${exportFormat === 'pdf' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setExportFormat('pdf')}
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* 预览区域 */}
      <div className="card mb-4">
        <h3 className="font-bold mb-3">{t('preview') || '预览'}</h3>
        {loading ? (
          <div className="loading">{t('loading') || '加载中...'}</div>
        ) : previewData ? (
          <div className="space-y-4">
            {reportType === 'profit' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-[14px] text-gray-500">{t('revenue') || '收入'}</div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(previewData.totalRevenue)}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="text-[14px] text-gray-500">{t('cost') || '成本'}</div>
                    <div className="text-lg font-bold text-red-600">{formatCurrency(previewData.totalCost)}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-[14px] text-gray-500">{t('netProfit') || '净利润'}</div>
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(previewData.netProfit)}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-[14px] text-gray-500">{t('profitMargin') || '利润率'}</div>
                    <div className="text-lg font-bold text-purple-600">
                      {previewData.totalRevenue > 0 ? ((previewData.netProfit / previewData.totalRevenue) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === 'cost' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-[14px] text-gray-500">{t('fixedCost') || '固定成本'}</div>
                  <div className="text-lg font-bold text-yellow-600">{formatCurrency(previewData.fixedTotal)}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-[14px] text-gray-500">{t('variableCost') || '变动成本'}</div>
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(previewData.variableTotal)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-[14px] text-gray-500">{t('total') || '合计'}</div>
                  <div className="text-lg font-bold text-gray-700">{formatCurrency(previewData.total)}</div>
                </div>
              </div>
            )}

            {reportType === 'revenue' && previewData.summary && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-[14px] text-gray-500">{t('totalRevenue') || '总营业额'}</div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(previewData.summary.totalRevenue)}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-[14px] text-gray-500">{t('orderCount') || '订单数'}</div>
                  <div className="text-lg font-bold text-blue-600">{previewData.summary.totalOrders || 0}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-[14px] text-gray-500">{t('avgOrder') || '客单价'}</div>
                  <div className="text-lg font-bold text-purple-600">{formatCurrency(previewData.summary.avgOrderValue)}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">{t('noData') || '暂无数据'}</div>
        )}
      </div>

      {/* 导出按钮 */}
      <div className="card">
        <button
          className="btn btn-primary w-full py-3 text-lg"
          onClick={handleExport}
          disabled={loading || !previewData}
        >
          {loading ? (t('loading') || '处理中...') : `⬇️ ${t('export') || '导出'} ${exportFormat === 'excel' ? 'Excel' : 'PDF'}`}
        </button>
        <p className="text-[14px] text-gray-500 mt-2 text-center">
          {t('exportTip') || 'Excel格式为CSV，可直接用Excel打开；PDF将打开新窗口进行打印'}
        </p>
      </div>
    </div>
  );
}
