import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function POSSettingsPage() {
  const { t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('layout');
  const [config, setConfig] = useState(null);

  // 默认配置
  const defaultConfig = {
    general: {
      shopName: "奶茶店",
      terminalId: "POS-001",
      currency: "IDR",
      currencySymbol: "Rp"
    },
    display: {
      layout: "grid",
      columnsCount: 4,
      showCategoryBar: true,
      showQuickActions: true,
      showTodayStats: true,
      showHygieneAlerts: true
    },
    categories: [
      { id: 1, name: "奶茶", icon: "🧋", enabled: true, sortOrder: 1 },
      { id: 2, name: "果汁", icon: "🍹", enabled: true, sortOrder: 2 },
      { id: 3, name: "咖啡", icon: "☕", enabled: true, sortOrder: 3 },
      { id: 4, name: "奶盖", icon: "🧊", enabled: true, sortOrder: 4 }
    ],
    quickActions: [
      { id: "cancel", label: "取消", icon: "✕", enabled: true, color: "red" },
      { id: "discount", label: "折扣", icon: "％", enabled: true, color: "blue" },
      { id: "hold", label: "挂单", icon: "📋", enabled: true, color: "yellow" },
      { id: "recall", label: "取单", icon: "📜", enabled: true, color: "green" }
    ],
    paymentMethods: [
      { id: "cash", label: "现金", enabled: true, isDefault: true },
      { id: "qris", label: "QRIS", enabled: true, isDefault: false },
      { id: "edc_bca", label: "BCA卡", enabled: false, isDefault: false },
      { id: "edc_mandiri", label: "Mandiri卡", enabled: false, isDefault: false }
    ],
    receipt: {
      showLogo: true,
      showQR: true,
      showOrderNo: true,
      showDateTime: true,
      footerMessage: "欢迎下次光临"
    },
    customerDisplay: {
      showLogo: true,
      showAds: true,
      adsContent: "欢迎光临！",
      showQR: true
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/pos/config');
      if (res?.success && res?.config) {
        setConfig(res.config);
      } else {
        setConfig(defaultConfig);
      }
    } catch (e) {
      console.error('Failed to load POS config:', e);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api('POST', '/pos/config', config);
      if (res?.success) {
        window.dispatchEvent(new CustomEvent('app:success', { detail: t('settingsSaved') || '设置已保存' }));
      } else {
        throw new Error(res?.error || '保存失败');
      }
    } catch (e) {
      console.error('Failed to save POS config:', e);
      window.dispatchEvent(new CustomEvent('app:error', { detail: e.message || '保存失败' }));
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path, value) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const updateArrayItem = (path, index, field, value) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[index][field] = value;
    setConfig(newConfig);
  };

  const toggleArrayItem = (path, index, field) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[index][field] = !obj[index][field];
    setConfig(newConfig);
  };

  const addArrayItem = (path, newItem) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj.push(newItem);
    setConfig(newConfig);
  };

  const removeArrayItem = (path, index) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj.splice(index, 1);
    setConfig(newConfig);
  };

  if (loading) {
    return <div className="py-24 text-center text-label-caps animate-pulse">{t('loading') || '正在加载...'}</div>;
  }

  if (!config) {
    return <div className="py-24 text-center text-red-500">加载配置失败</div>;
  }

  const tabs = [
    { key: 'layout', label: '界面布局', icon: '📐' },
    { key: 'categories', label: '分类配置', icon: '🏷️' },
    { key: 'quickActions', label: '快捷按钮', icon: '⚡' },
    { key: 'payment', label: '支付设置', icon: '💳' },
    { key: 'receipt', label: '小票设置', icon: '🧾' },
    { key: 'customerDisplay', label: '副屏设置', icon: '🖥️' },
  ];

  return (
    <div className="space-y-8 animate-soft">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-h3 font-black text-slate-900">POS 配置中心</h2>
          <p className="text-label-caps text-slate-400 mt-1">自定义收银终端界面与功能</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-premium active !bg-orange-600 !text-white !px-8 !h-14 border-none shadow-xl text-[14px] font-black uppercase tracking-widest rounded-[20px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {saving ? '保存中...' : '💾 保存配置'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 rounded-full text-[14px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
        {/* 界面布局 */}
        {activeTab === 'layout' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">界面布局设置</h3>
            
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">店铺名称</label>
                <input
                  type="text"
                  value={config.general.shopName}
                  onChange={(e) => updateConfig('general.shopName', e.target.value)}
                  className="input-premium !py-4 !px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">终端ID</label>
                <input
                  type="text"
                  value={config.general.terminalId}
                  onChange={(e) => updateConfig('general.terminalId', e.target.value)}
                  className="input-premium !py-4 !px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">货币</label>
                <input
                  type="text"
                  value={config.general.currency}
                  onChange={(e) => updateConfig('general.currency', e.target.value)}
                  className="input-premium !py-4 !px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">货币符号</label>
                <input
                  type="text"
                  value={config.general.currencySymbol}
                  onChange={(e) => updateConfig('general.currencySymbol', e.target.value)}
                  className="input-premium !py-4 !px-6"
                />
              </div>
            </div>

            {/* 显示选项 */}
            <div className="space-y-4">
              <h4 className="text-[16px] font-black text-slate-700 uppercase tracking-widest">显示选项</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ToggleItem
                  label="显示分类栏"
                  checked={config.display.showCategoryBar}
                  onChange={(v) => updateConfig('display.showCategoryBar', v)}
                />
                <ToggleItem
                  label="显示快捷按钮"
                  checked={config.display.showQuickActions}
                  onChange={(v) => updateConfig('display.showQuickActions', v)}
                />
                <ToggleItem
                  label="显示今日统计"
                  checked={config.display.showTodayStats}
                  onChange={(v) => updateConfig('display.showTodayStats', v)}
                />
                <ToggleItem
                  label="显示卫生提醒"
                  checked={config.display.showHygieneAlerts}
                  onChange={(v) => updateConfig('display.showHygieneAlerts', v)}
                />
              </div>
            </div>

            {/* 布局设置 */}
            <div className="space-y-4">
              <h4 className="text-[16px] font-black text-slate-700 uppercase tracking-widest">布局样式</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">布局类型</label>
                  <select
                    value={config.display.layout}
                    onChange={(e) => updateConfig('display.layout', e.target.value)}
                    className="input-premium !py-4 !px-6"
                  >
                    <option value="grid">网格布局</option>
                    <option value="list">列表布局</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">列数</label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={config.display.columnsCount}
                    onChange={(e) => updateConfig('display.columnsCount', parseInt(e.target.value) || 4)}
                    className="input-premium !py-4 !px-6"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分类配置 */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">分类配置</h3>
            <p className="text-[14px] text-slate-500">拖拽排序，调整分类在POS端显示的顺序</p>
            
            <div className="space-y-3">
              {config.categories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[20px] border border-slate-100">
                  <span className="text-2xl">{cat.icon}</span>
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => updateArrayItem('categories', idx, 'name', e.target.value)}
                    className="input-premium !py-3 !px-4 flex-1"
                  />
                  <input
                    type="text"
                    value={cat.icon}
                    onChange={(e) => updateArrayItem('categories', idx, 'icon', e.target.value)}
                    className="input-premium !py-3 !px-4 w-20"
                  />
                  <ToggleItem
                    checked={cat.enabled}
                    onChange={() => toggleArrayItem('categories', idx, 'enabled')}
                  />
                  <button
                    onClick={() => removeArrayItem('categories', idx)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => addArrayItem('categories', {
                id: Date.now(),
                name: "新分类",
                icon: "📦",
                enabled: true,
                sortOrder: config.categories.length + 1
              })}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full text-[14px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              + 添加分类
            </button>
          </div>
        )}

        {/* 快捷按钮 */}
        {activeTab === 'quickActions' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">快捷按钮配置</h3>
            <p className="text-[14px] text-slate-500">配置POS端显示的快捷操作按钮</p>
            
            <div className="space-y-3">
              {config.quickActions.map((action, idx) => (
                <div key={action.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[20px] border border-slate-100">
                  <span className="text-2xl w-10 text-center">{action.icon}</span>
                  <input
                    type="text"
                    value={action.label}
                    onChange={(e) => updateArrayItem('quickActions', idx, 'label', e.target.value)}
                    className="input-premium !py-3 !px-4 flex-1"
                  />
                  <select
                    value={action.color}
                    onChange={(e) => updateArrayItem('quickActions', idx, 'color', e.target.value)}
                    className="input-premium !py-3 !px-4 w-32"
                  >
                    <option value="red">红色</option>
                    <option value="blue">蓝色</option>
                    <option value="yellow">黄色</option>
                    <option value="green">绿色</option>
                    <option value="orange">橙色</option>
                    <option value="purple">紫色</option>
                  </select>
                  <ToggleItem
                    checked={action.enabled}
                    onChange={() => toggleArrayItem('quickActions', idx, 'enabled')}
                  />
                  <button
                    onClick={() => removeArrayItem('quickActions', idx)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => addArrayItem('quickActions', {
                id: Date.now().toString(),
                label: "新按钮",
                icon: "⚡",
                enabled: true,
                color: "blue"
              })}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full text-[14px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              + 添加快捷按钮
            </button>
          </div>
        )}

        {/* 支付设置 */}
        {activeTab === 'payment' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">支付方式配置</h3>
            <p className="text-[14px] text-slate-500">启用/禁用支付方式，设置默认支付方式</p>
            
            <div className="space-y-3">
              {config.paymentMethods.map((method, idx) => (
                <div key={method.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[20px] border border-slate-100">
                  <input
                    type="text"
                    value={method.label}
                    onChange={(e) => updateArrayItem('paymentMethods', idx, 'label', e.target.value)}
                    className="input-premium !py-3 !px-4 flex-1"
                  />
                  <ToggleItem
                    label="启用"
                    checked={method.enabled}
                    onChange={() => toggleArrayItem('paymentMethods', idx, 'enabled')}
                  />
                  <ToggleItem
                    label="默认"
                    checked={method.isDefault}
                    onChange={() => {
                      const newMethods = config.paymentMethods.map((m, i) => ({
                        ...m,
                        isDefault: i === idx
                      }));
                      setConfig({ ...config, paymentMethods: newMethods });
                    }}
                  />
                  <button
                    onClick={() => removeArrayItem('paymentMethods', idx)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => addArrayItem('paymentMethods', {
                id: Date.now().toString(),
                label: "新支付方式",
                enabled: true,
                isDefault: false
              })}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full text-[14px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              + 添加支付方式
            </button>
          </div>
        )}

        {/* 小票设置 */}
        {activeTab === 'receipt' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">小票打印设置</h3>
            
            <div className="space-y-4">
              <h4 className="text-[16px] font-black text-slate-700 uppercase tracking-widest">显示内容</h4>
              <div className="grid grid-cols-2 gap-4">
                <ToggleItem
                  label="显示Logo"
                  checked={config.receipt.showLogo}
                  onChange={(v) => updateConfig('receipt.showLogo', v)}
                />
                <ToggleItem
                  label="显示二维码"
                  checked={config.receipt.showQR}
                  onChange={(v) => updateConfig('receipt.showQR', v)}
                />
                <ToggleItem
                  label="显示订单号"
                  checked={config.receipt.showOrderNo}
                  onChange={(v) => updateConfig('receipt.showOrderNo', v)}
                />
                <ToggleItem
                  label="显示日期时间"
                  checked={config.receipt.showDateTime}
                  onChange={(v) => updateConfig('receipt.showDateTime', v)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">页脚消息</label>
              <input
                type="text"
                value={config.receipt.footerMessage}
                onChange={(e) => updateConfig('receipt.footerMessage', e.target.value)}
                className="input-premium !py-4 !px-6"
                placeholder="例如：欢迎下次光临"
              />
            </div>
          </div>
        )}

        {/* 副屏设置 */}
        {activeTab === 'customerDisplay' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">副屏（顾客屏）设置</h3>
            
            <div className="space-y-4">
              <h4 className="text-[16px] font-black text-slate-700 uppercase tracking-widest">显示内容</h4>
              <div className="grid grid-cols-2 gap-4">
                <ToggleItem
                  label="显示Logo"
                  checked={config.customerDisplay.showLogo}
                  onChange={(v) => updateConfig('customerDisplay.showLogo', v)}
                />
                <ToggleItem
                  label="显示二维码"
                  checked={config.customerDisplay.showQR}
                  onChange={(v) => updateConfig('customerDisplay.showQR', v)}
                />
                <ToggleItem
                  label="显示广告"
                  checked={config.customerDisplay.showAds}
                  onChange={(v) => updateConfig('customerDisplay.showAds', v)}
                />
              </div>
            </div>
            
            {config.customerDisplay.showAds && (
              <div className="space-y-2">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">广告内容</label>
                <input
                  type="text"
                  value={config.customerDisplay.adsContent}
                  onChange={(e) => updateConfig('customerDisplay.adsContent', e.target.value)}
                  className="input-premium !py-4 !px-6"
                  placeholder="例如：欢迎光临！新品上市..."
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white">
        <h3 className="text-lg font-black mb-4">📱 POS 预览</h3>
        <div className="bg-slate-800 rounded-[24px] p-6">
          <div className="text-center mb-4">
            <span className="text-2xl font-black">{config.general.shopName}</span>
            <span className="text-slate-400 ml-2">| {config.general.terminalId}</span>
          </div>
          
          {/* Quick Actions Preview */}
          {config.display.showQuickActions && (
            <div className="flex justify-center gap-2 mb-4">
              {config.quickActions.filter(a => a.enabled).slice(0, 4).map(action => (
                <span
                  key={action.id}
                  className={`px-3 py-2 rounded-full text-xs font-black ${
                    action.color === 'red' ? 'bg-red-600' :
                    action.color === 'blue' ? 'bg-blue-600' :
                    action.color === 'yellow' ? 'bg-yellow-600 text-black' :
                    action.color === 'green' ? 'bg-green-600' :
                    action.color === 'orange' ? 'bg-orange-600' :
                    'bg-purple-600'
                  }`}
                >
                  {action.icon} {action.label}
                </span>
              ))}
            </div>
          )}
          
          {/* Categories Preview */}
          {config.display.showCategoryBar && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {config.categories.filter(c => c.enabled).map(cat => (
                <span key={cat.id} className="px-4 py-2 bg-slate-700 rounded-full text-sm font-black">
                  {cat.icon} {cat.name}
                </span>
              ))}
            </div>
          )}
          
          {/* Payment Methods Preview */}
          <div className="flex justify-center gap-2">
            {config.paymentMethods.filter(m => m.enabled).map(method => (
              <span
                key={method.id}
                className={`px-4 py-2 rounded-full text-sm font-black ${
                  method.isDefault ? 'bg-orange-600' : 'bg-slate-700'
                }`}
              >
                {method.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Component
function ToggleItem({ label, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-[16px] border border-slate-100">
      <span className="text-[14px] font-black text-slate-600 flex-1">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 rounded-full transition-all ${
          checked ? 'bg-orange-600' : 'bg-slate-200'
        }`}
      >
        <div
          className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
