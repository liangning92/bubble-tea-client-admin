import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function AdManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [displayMode, setDisplayMode] = useState('dual');

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    type: 'promo',
    priority: 0,
    status: 'active',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadAds();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api('GET', '/system/config');
      if (res && res.posDisplayMode) setDisplayMode(res.posDisplayMode);
    } catch (e) {
      console.warn('Failed to load system config');
    }
  };

  const updateDisplayMode = async (mode) => {
    setLoading(true);
    try {
      await api('POST', '/system/config', { posDisplayMode: mode });
      setDisplayMode(mode);
      window.dispatchEvent(new CustomEvent('app:success', { detail: `已切换至 ${mode === 'dual' ? '双屏' : '单屏'} 模式` }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '修改显示模式失败' } }));
    } finally {
      setLoading(false);
    }
  };

  const handleSmartGenerate = async () => {
    setLoading(true);
    try {
      const res = await api('POST', '/marketing/ads/auto-generate');
      window.dispatchEvent(new CustomEvent('app:success', { detail: `AI 成功生成 ${res.count} 个精准营销内容` }));
      loadAds();
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '生成失败，请检查近期销量数据' } }));
    } finally {
      setLoading(false);
    }
  };

  const loadAds = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/marketing/ads');
      setAds(Array.isArray(res) ? res : []);
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '加载广告失败' } }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAd) {
        await api('PUT', `/marketing/ads/${editingAd.id}`, formData);
      } else {
        await api('POST', '/marketing/ads', formData);
      }
      setShowModal(false);
      loadAds();
      window.dispatchEvent(new CustomEvent('app:success', { detail: '保存成功' }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '保存失败' } }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该广告吗？')) return;
    try {
      await api('DELETE', `/marketing/ads/${id}`);
      loadAds();
      window.dispatchEvent(new CustomEvent('app:success', { detail: '已删除' }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '删除失败' } }));
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">屏幕与设备中心</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[14px]">Hardware & Screen Configuration</p>
        </div>

        <div className="bg-white border-2 border-slate-100 p-2 rounded-[24px] flex gap-2 shadow-xl shadow-slate-200/50">
          <button
            disabled={loading}
            onClick={() => updateDisplayMode('single')}
            className={`px-8 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 ${displayMode === 'single' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            🖥️ 仅店员主屏
          </button>
          <button
            disabled={loading}
            onClick={() => updateDisplayMode('dual')}
            className={`px-8 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 ${displayMode === 'dual' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            📺 客显双屏模式
          </button>
        </div>
      </div>

      {displayMode === 'single' ? (
        <div className="bg-white rounded-[40px] p-16 text-center border-4 border-dashed border-slate-100 flex flex-col items-center">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-6xl mb-8 grayscale opacity-50">👩‍🍳</div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">店员专用模式 (Standalone)</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            当前门店配置为单屏幕架构。收银系统将专注于店员的高效操作，不显示也不需要配置任何顾客端广告内容。
          </p>
          <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 inline-flex items-center gap-3 text-slate-500 font-bold text-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            收银端已锁定为高效极简界面
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800">副屏营销中心</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-tighter">Manage Secondary Display Content</p>
            </div>
            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={handleSmartGenerate}
                className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                {loading ? '...' : '🤖 AI 智能生成'}
              </button>
              <button
                onClick={() => {
                  setEditingAd(null);
                  setFormData({ title: '', imageUrl: '', type: 'promo', priority: 0, status: 'active', startDate: '', endDate: '' });
                  setShowModal(true);
                }}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <span>➕</span> 开发新广告
              </button>
            </div>
          </div>

          {loading && ads.length === 0 ? (
            <div className="flex justify-center p-20 text-slate-400 font-bold ">Loading Asset Matrix...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ads.map(ad => (
                <div key={ad.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 flex flex-col group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300">
                  <div className="h-56 overflow-hidden relative bg-slate-200">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-[14px] font-black uppercase text-indigo-600 shadow-sm">
                      {ad.type}
                    </div>
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{ad.title}</h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-6">
                      <span className={`w-3 h-3 rounded-full ${ad.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      {ad.status === 'active' ? 'Active on Display' : 'Paused'}
                      <span className="mx-2 opacity-30">|</span>
                      PRIO: {ad.priority}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditingAd(ad);
                          setFormData({ ...ad });
                          setShowModal(true);
                        }}
                        className="flex-1 py-3 bg-slate-50 text-slate-800 font-black rounded-[20px] hover:bg-slate-100 transition-all text-[14px]"
                      >
                        Edit Configuration
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="px-5 py-3 bg-red-50 text-red-500 font-black rounded-[20px] hover:bg-red-100 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-indigo-600 text-white font-black text-xl text-center">
              {editingAd ? '编辑广告内容' : '创建新营销内容'}
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[14px] font-black text-slate-400 mb-2 uppercase">广告标题</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-indigo-500 transition-all"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[14px] font-black text-slate-400 mb-2 uppercase">图片 URL (支持外部链接或上传路径)</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-black text-slate-400 mb-2 uppercase">广告类型</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-indigo-500 transition-all"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="promo">常规促销 (Promo)</option>
                    <option value="new_item">新品推介 (New In)</option>
                    <option value="announcement">品牌公告 (Info)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-black text-slate-400 mb-2 uppercase">显示权重 (越大越靠前)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-indigo-500 transition-all"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  {loading ? '保存中...' : '发布内容'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
