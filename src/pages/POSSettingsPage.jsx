import React, { useState, useEffect } from "react";
import { api, useAuth } from "../context/AuthContext";

const TABS = [
  { id: "layout", label: "界面布局" },
  { id: "quickActions", label: "快捷按钮" },
  { id: "payment", label: "支付设置" },
  { id: "receipt", label: "小票设置" },
  { id: "categories", label: "分类配置" },
  { id: "language", label: "语言设置" }
];

const LANGUAGE_OPTIONS = [
  { value: 'zh', label: '中文', flag: '🇨🇳', description: '简体中文界面' },
  { value: 'en', label: 'English', flag: '🇬🇧', description: 'English interface' },
  { value: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', description: 'Antarmuka Bahasa Indonesia' },
];

const DEFAULT_CONFIG = {
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
    showHygieneAlerts: true,
    theme: 'dark'
  },
  language: 'zh',
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
  }
};

export default function POSSettingsPage() {
  const { t, lang } = useAuth();
  const [activeTab, setActiveTab] = useState("layout");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await api("GET", "/pos/config");
      if (res?.success && res?.config) {
        setConfig(res.config);
      }
    } catch (e) {
      console.error("Failed to load POS config:", e);
    }
    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await api("POST", "/pos/config", config);
      if (res?.success) {
        setSaveMsg("✅ 保存成功");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveMsg("❌ 保存失败");
      }
    } catch (e) {
      setSaveMsg("❌ 保存失败: " + (e.message || "未知错误"));
    }
    setSaving(false);
  }

  function updateConfig(path, value) {
    const newConfig = { ...config };
    const keys = path.split(".");
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = { ...obj[keys[i]] };
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  }

  function updateArrayItem(arrayName, index, field, value) {
    const arr = [...(config[arrayName] || [])];
    arr[index] = { ...arr[index], [field]: value };
    updateConfig(arrayName, arr);
  }

  function addArrayItem(arrayName, item) {
    const arr = [...(config[arrayName] || []), item];
    updateConfig(arrayName, arr);
  }

  function removeArrayItem(arrayName, index) {
    const arr = (config[arrayName] || []).filter((_, i) => i !== index);
    updateConfig(arrayName, arr);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">📱 {t('posSettings')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('posSettingsDesc')}</p>
        </div>
        <div className="flex items-center gap-4">
          {saveMsg && <span className="text-sm font-bold">{saveMsg}</span>}
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-50"
          >
            {saving ? t('saving') : `💾 ${t('saveConfig')}`}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-2 rounded-2xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
        {/* Layout Tab */}
        {activeTab === "layout" && (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">{t('layoutTab')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('layoutMethod')}</label>
                  <select
                    value={config.display?.layout || "grid"}
                    onChange={e => updateConfig("display.layout", e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                  >
                    <option value="grid">{t('gridLayout')}</option>
                    <option value="list">{t('listLayout')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('columnsPerRow')}</label>
                  <select
                    value={config.display?.columnsCount || 4}
                    onChange={e => updateConfig("display.columnsCount", Number(e.target.value))}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                  >
                    {[3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} {t('cols')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-700">{t('displayOptions')}</h4>
              {[
                { key: "showCategoryBar", labelKey: "showCategoryBar" },
                { key: "showQuickActions", labelKey: "showQuickActions" },
                { key: "showTodayStats", labelKey: "showTodayStats" },
                { key: "showHygieneAlerts", labelKey: "showHygieneAlerts" }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.display?.[item.key] ?? true}
                    onChange={e => updateConfig(`display.${item.key}`, e.target.checked)}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <span className="font-bold text-slate-700">{t(item.labelKey)}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('shopName')}</label>
                <input
                  type="text"
                  value={config.general?.shopName || ""}
                  onChange={e => updateConfig("general.shopName", e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('terminalId')}</label>
                <input
                  type="text"
                  value={config.general?.terminalId || ""}
                  onChange={e => updateConfig("general.terminalId", e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Tab */}
        {activeTab === "quickActions" && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 mb-4">{t('quickActionsConfig')}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('quickActionsConfigDesc')}</p>
            <div className="space-y-3">
              {(config.quickActions || []).map((action, index) => (
                <div key={action.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={action.label}
                      onChange={e => updateArrayItem("quickActions", index, "label", e.target.value)}
                      className="p-2 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                      placeholder={t('label')}
                    />
                    <input
                      type="text"
                      value={action.icon}
                      onChange={e => updateArrayItem("quickActions", index, "icon", e.target.value)}
                      className="p-2 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                      placeholder={t('icon')}
                    />
                    <select
                      value={action.color}
                      onChange={e => updateArrayItem("quickActions", index, "color", e.target.value)}
                      className="p-2 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                    >
                      <option value="red">{t('red')}</option>
                      <option value="blue">{t('blue')}</option>
                      <option value="yellow">{t('yellow')}</option>
                      <option value="green">{t('green')}</option>
                      <option value="gray">{t('gray')}</option>
                    </select>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={action.enabled}
                        onChange={e => updateArrayItem("quickActions", index, "enabled", e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <span className="font-bold">{t('enabled')}</span>
                    </label>
                  </div>
                  <button
                    onClick={() => removeArrayItem("quickActions", index)}
                    className="w-10 h-10 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addArrayItem("quickActions", { id: Date.now(), label: t('newButton'), icon: "⭐", enabled: true, color: "gray" })}
              className="mt-4 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              + {t('addButton')}
            </button>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === "payment" && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 mb-4">{t('paymentMethodsConfig')}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('paymentMethodsConfigDesc')}</p>
            <div className="space-y-3">
              {(config.paymentMethods || []).map((method, index) => (
                <div key={method.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={method.label}
                      onChange={e => updateArrayItem("paymentMethods", index, "label", e.target.value)}
                      className="p-2 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                      placeholder={t('paymentMethodName')}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={e => updateArrayItem("paymentMethods", index, "enabled", e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <span className="font-bold">{t('enabled')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`default-payment-${index}`}
                        checked={method.isDefault}
                        onChange={() => {
                          const methods = (config.paymentMethods || []).map((m, i) => ({
                            ...m,
                            isDefault: i === index
                          }));
                          updateConfig("paymentMethods", methods);
                        }}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <span className="font-bold">{t('default')}</span>
                    </label>
                  </div>
                  <button
                    onClick={() => removeArrayItem("paymentMethods", index)}
                    className="w-10 h-10 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addArrayItem("paymentMethods", { id: Date.now(), label: t('newPaymentMethod'), enabled: true, isDefault: false })}
              className="mt-4 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              + {t('addButton')}
            </button>
          </div>
        )}

        {/* Receipt Tab */}
        {activeTab === "receipt" && (
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-900 mb-4">{t('receiptSettings')}</h3>
            <div className="space-y-4">
              {[
                { key: "showLogo", label: "Logo" },
                { key: "showQR", label: "QR Code" },
                { key: "showOrderNo", label: "Order No" },
                { key: "showDateTime", label: "Date/Time" }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.receipt?.[item.key] ?? true}
                    onChange={e => updateConfig(`receipt.${item.key}`, e.target.checked)}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <span className="font-bold text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('receiptFooter')}</label>
              <input
                type="text"
                value={config.receipt?.footerMessage || ""}
                onChange={e => updateConfig("receipt.footerMessage", e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                placeholder={t('receiptFooter')}
              />
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 mb-4">{t('categoryConfig')}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('categoryConfigDesc')}</p>
            <div className="space-y-3">
              {(config.categories || []).map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={cat.icon}
                      onChange={e => updateArrayItem("categories", index, "icon", e.target.value)}
                      className="p-2 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none text-center text-xl"
                      placeholder={t('icon')}
                    />
                    <input
                      type="text"
                      value={cat.name}
                      onChange={e => updateArrayItem("categories", index, "name", e.target.value)}
                      className="p-2 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                      placeholder={t('categoryName')}
                    />
                    <input
                      type="number"
                      value={cat.sortOrder || index + 1}
                      onChange={e => updateArrayItem("categories", index, "sortOrder", Number(e.target.value))}
                      className="p-2 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                      placeholder={t('sortOrder')}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cat.enabled}
                        onChange={e => updateArrayItem("categories", index, "enabled", e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <span className="font-bold">{t('enabled')}</span>
                    </label>
                  </div>
                  <button
                    onClick={() => removeArrayItem("categories", index)}
                    className="w-10 h-10 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addArrayItem("categories", { id: Date.now(), name: t('categoryName'), icon: "📦", enabled: true, sortOrder: (config.categories?.length || 0) + 1 })}
              className="mt-4 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              + {t('addButton')}
            </button>
          </div>
        )}

        {/* Language Tab */}
        {activeTab === "language" && (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{t('language')}</h3>
              <p className="text-sm text-slate-500 mb-6">{t('language')} POS</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {LANGUAGE_OPTIONS.map(langOpt => (
                  <button
                    key={langOpt.value}
                    onClick={() => updateConfig("language", langOpt.value)}
                    className={`p-6 rounded-2xl border-4 text-center transition-all ${
                      config.language === langOpt.value
                        ? "border-orange-500 bg-orange-50 shadow-lg"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-4xl mb-3">{langOpt.flag}</div>
                    <div className="font-black text-lg text-slate-900 mb-1">{langOpt.label}</div>
                    <div className="text-sm text-slate-500">{langOpt.description}</div>
                    {config.language === langOpt.value && (
                      <div className="mt-3 text-orange-600 font-black text-sm">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">Theme</h3>
              <p className="text-sm text-slate-500 mb-4">POS theme</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', name: 'White', preview: '#f8fafc' },
                  { id: 'dark', name: 'Dark', preview: '#0f172a' },
                  { id: 'orange', name: 'Orange', preview: '#fff7ed' },
                ].map(themeOpt => (
                  <button
                    key={themeOpt.id}
                    onClick={() => updateConfig("display.theme", themeOpt.id)}
                    className={`p-4 rounded-2xl border-4 text-center transition-all ${
                      config.display?.theme === themeOpt.id
                        ? "border-orange-500 shadow-lg"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded-xl mb-3"
                      style={{ backgroundColor: themeOpt.preview, border: '1px solid #e2e8f0' }}
                    />
                    <div className="font-black text-sm text-slate-900">{themeOpt.name}</div>
                    {config.display?.theme === themeOpt.id && (
                      <div className="mt-2 text-orange-600 font-black text-sm">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
