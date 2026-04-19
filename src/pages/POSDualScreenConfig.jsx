import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * POSDualScreenConfig - 双屏配置面板
 * 主/副屏独立配置，小组件开关，提醒时间间隔设置
 */
export default function POSDualScreenConfig() {
  const { t, canAccess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    mode: 'dual',
    mainScreen: {
      showCategories: true,
      showCart: true,
      showQuickActions: true,
      showTodayStats: true,
    },
    customerDisplay: {
      showItems: true,
      showQR: true,
      showAds: true,
      showLogo: true,
      showCheckIn: true,
    },
    staffReminder: {
      enabled: true,
      intervalMinutes: 30,
      types: ['clean', 'shift', 'ingredient', 'device'],
      soundEnabled: true,
    },
    quickActions: {
      showPaymentMethods: true,
      showCashDrawer: true,
      showPrint: true,
      showCancel: true,
    },
  });

  // 检查权限
  const isAdmin = canAccess && canAccess('pos_dual_screen_admin');

  // 加载配置
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos/dual-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Lang': localStorage.getItem('lang') || 'zh',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setConfig({ ...config, ...data });
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // 保存配置
  const handleSave = async (newConfig = config) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pos/dual-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error('Failed');
      
      window.dispatchEvent(new CustomEvent('app:success', { 
        detail: t('configSaved') || '配置已保存' 
      }));
    } catch (e) {
      console.error('Save failed:', e);
      window.dispatchEvent(new CustomEvent('app:error', { 
        detail: t('saveFailed') || '保存失败' 
      }));
    } finally {
      setSaving(false);
    }
  };

  // 切换布尔值配置
  const toggleConfig = (path, key) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[key] = !obj[key];
    setConfig(newConfig);
    handleSave(newConfig);
  };

  // 更新数值配置
  const updateConfig = (path, key, value) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[key] = value;
    setConfig(newConfig);
    handleSave(newConfig);
  };

  // 切换提醒类型
  const toggleReminderType = (type) => {
    const types = config.staffReminder.types.includes(type)
      ? config.staffReminder.types.filter((t) => t !== type)
      : [...config.staffReminder.types, type];
    updateConfig('staffReminder', 'types', types);
  };

  if (loading) {
    return (
      <div className="py-24 text-center animate-pulse">
        <div className="text-label-caps text-slate-400">{t('loading') || '加载中...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* 页头 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 px-4 gap-6">
        <div className="space-y-4">
          <h2 className="text-h2 uppercase">{t('dualScreenConfig') || '双屏配置'}</h2>
          <p className="text-label-caps !text-slate-400">{t('dualScreenConfigDesc') || '配置副屏显示与店员提醒功能'}</p>
        </div>
        {!isAdmin && (
          <div className="px-4 py-2 bg-orange-500/20 text-orange-500 rounded-full text-sm font-bold">
            {t('readOnly') || '只读权限'}
          </div>
        )}
      </div>

      {/* 主屏配置 */}
      <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl">📱</div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest">{t('mainScreenConfig') || '主屏配置'}</h3>
            <p className="text-sm text-slate-400">{t('mainScreenDesc') || '收银员操作界面模块'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'showCategories', label: t('categoryPanel') || '分类面板', icon: '📂' },
            { key: 'showCart', label: t('cartPanel') || '购物车', icon: '🛒' },
            { key: 'showQuickActions', label: t('quickActions') || '快捷操作', icon: '⚡' },
            { key: 'showTodayStats', label: t('todayStats') || '今日数据', icon: '📊' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => isAdmin && toggleConfig('mainScreen', item.key)}
              disabled={!isAdmin}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                config.mainScreen[item.key]
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              } ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 副屏配置 */}
      <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl">💻</div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest">{t('customerDisplayConfig') || '副屏配置'}</h3>
            <p className="text-sm text-slate-400">{t('customerDisplayDesc') || '顾客看到的显示内容'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { key: 'showItems', label: t('orderDetails') || '订单明细', icon: '📋' },
            { key: 'showQR', label: t('paymentQR') || '支付二维码', icon: '📱' },
            { key: 'showAds', label: t('advertisement') || '广告轮播', icon: '🎬' },
            { key: 'showLogo', label: t('brandLogo') || '品牌Logo', icon: '🧋' },
            { key: 'showCheckIn', label: t('staffCheckIn') || '员工考勤', icon: '👤' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => isAdmin && toggleConfig('customerDisplay', item.key)}
              disabled={!isAdmin}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                config.customerDisplay[item.key]
                  ? 'border-orange-500 bg-orange-500/10 text-orange-600'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              } ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 分辨率预览 */}
        <div className="p-6 bg-slate-50 rounded-3xl">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            {t('preview') || '布局预览'} (1920×1080)
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 flex gap-4">
            {/* 主内容60% */}
            <div className="flex-1 bg-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-2">{t('mainContent') || '主内容'} (60%)</div>
              <div className="space-y-2">
                {config.customerDisplay.showItems && (
                  <div className="h-8 bg-slate-700 rounded-lg flex items-center px-2">
                    <span className="text-xs text-slate-400">{t('orderItems') || '商品明细'}</span>
                  </div>
                )}
                {config.customerDisplay.showQR && (
                  <div className="h-20 bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded" />
                  </div>
                )}
              </div>
            </div>
            {/* 广告区域40% */}
            <div className="w-32 bg-slate-700/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-2">{t('bottomArea') || '底部'} (40%)</div>
              {config.customerDisplay.showAds && (
                <div className="h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg mb-2" />
              )}
              {config.customerDisplay.showCheckIn && (
                <div className="h-16 bg-slate-600 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 店员提醒配置 */}
      <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-2xl">⏰</div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest">{t('staffReminderConfig') || '店员提醒'}</h3>
            <p className="text-sm text-slate-400">{t('staffReminderDesc') || '定时弹出工作提醒'}</p>
          </div>
        </div>

        {/* 开关 */}
        <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <div className="font-bold">{t('enableReminder') || '启用提醒'}</div>
              <div className="text-sm text-slate-400">{t('enableReminderDesc') || '自动弹出定时提醒'}</div>
            </div>
          </div>
          <button
            onClick={() => isAdmin && toggleConfig('staffReminder', 'enabled')}
            disabled={!isAdmin}
            className={`w-14 h-8 rounded-full transition-all relative ${
              config.staffReminder.enabled ? 'bg-orange-500' : 'bg-slate-300'
            } ${!isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
              config.staffReminder.enabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        {/* 提醒间隔 */}
        <div className="mb-8">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            {t('reminderInterval') || '提醒间隔'}
          </div>
          <div className="flex gap-3">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => isAdmin && updateConfig('staffReminder', 'intervalMinutes', mins)}
                disabled={!isAdmin}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                  config.staffReminder.intervalMinutes === mins
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                } ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                {mins} {t('minutes') || '分钟'}
              </button>
            ))}
          </div>
        </div>

        {/* 提醒类型 */}
        <div className="mb-8">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            {t('reminderTypes') || '提醒类型'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'clean', label: t('cleanReminder') || '清洁提醒', icon: '🧹', color: 'from-blue-500 to-blue-600' },
              { key: 'shift', label: t('shiftReminder') || '交接班提醒', icon: '👥', color: 'from-purple-500 to-purple-600' },
              { key: 'ingredient', label: t('ingredientReminder') || '食材检查', icon: '📦', color: 'from-green-500 to-green-600' },
              { key: 'device', label: t('deviceReminder') || '设备巡检', icon: '⚙️', color: 'from-orange-500 to-orange-600' },
            ].map((type) => (
              <button
                key={type.key}
                onClick={() => isAdmin && toggleReminderType(type.key)}
                disabled={!isAdmin}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  config.staffReminder.types.includes(type.key)
                    ? `border-transparent bg-gradient-to-r ${type.color} text-white`
                    : 'border-slate-100 bg-slate-50 text-slate-400'
                } ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <span className="text-3xl mb-2 block">{type.icon}</span>
                <span className="text-sm font-bold">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 声音开关 */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔊</span>
            <div>
              <div className="font-bold">{t('soundAlert') || '声音提醒'}</div>
              <div className="text-sm text-slate-400">{t('soundAlertDesc') || '提醒时播放提示音'}</div>
            </div>
          </div>
          <button
            onClick={() => isAdmin && toggleConfig('staffReminder', 'soundEnabled')}
            disabled={!isAdmin}
            className={`w-14 h-8 rounded-full transition-all relative ${
              config.staffReminder.soundEnabled ? 'bg-orange-500' : 'bg-slate-300'
            } ${!isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
              config.staffReminder.soundEnabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* 快捷操作栏配置 */}
      <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest">{t('quickActionsConfig') || '快捷操作栏'}</h3>
            <p className="text-sm text-slate-400">{t('quickActionsDesc') || '底部快捷功能按钮配置'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'showPaymentMethods', label: t('paymentMethods') || '支付方式', icon: '💵' },
            { key: 'showCashDrawer', label: t('cashDrawer') || '钱箱', icon: '💰' },
            { key: 'showPrint', label: t('printReceipt') || '打印', icon: '🧾' },
            { key: 'showCancel', label: t('cancelOrder') || '取消', icon: '❌' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => isAdmin && toggleConfig('quickActions', item.key)}
              disabled={!isAdmin}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                config.quickActions[item.key]
                  ? 'border-green-500 bg-green-500/10 text-green-600'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              } ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 保存提示 */}
      <div className="text-center py-8">
        <p className="text-sm text-slate-400">
          {isAdmin 
            ? (t('autoSaveEnabled') || '修改将自动保存')
            : (t('adminRequired') || '需要管理员权限才能修改配置')
          }
        </p>
      </div>
    </div>
  );
}
