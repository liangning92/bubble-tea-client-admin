import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

export default function SidebarLayout({ menuItems, title, topAlert }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, lang, changeLang, t } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden select-none">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] md:hidden animate-soft"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-80 bg-white border-r border-slate-100 text-slate-600 transform transition-all duration-500 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0 !w-88 shadow-3xl' : '-translate-x-full'}`}>
        <div className="h-28 flex items-center px-8 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white shadow-2xl shadow-slate-200/50 rounded-full flex items-center justify-center overflow-hidden border border-slate-50 p-0.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
              <img src="/shopwise-brand-logo.png" className="w-full h-full object-contain rounded-full" alt="Shopwise Logo" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl text-slate-900 tracking-tight leading-tight uppercase">Shopwise</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] opacity-80">{t('storeMgmtSystem')}</span>
            </div>
          </div>
        </div>

        <div className="p-8 h-[calc(100vh-240px)] overflow-y-auto no-scrollbar space-y-2">
          <div className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 mt-4 px-3 opacity-60">{t('sidebarConsole')}</div>
          <nav className="space-y-4">
            {(menuItems || []).map(item => {
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-5 px-6 py-5 text-[15px] font-black uppercase tracking-tight transition-all duration-300 rounded-[24px] border border-transparent ${active
                      ? 'bg-primary text-white shadow-3xl shadow-primary/10 scale-[1.02]'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span className={`text-2xl transition-all duration-300 ${active ? 'scale-110' : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Quick Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-slate-50 bg-white/50 backdrop-blur-xl">
          <div className="flex items-center gap-5 mb-8 px-2">
            <div className="w-14 h-14 rounded-[22px] bg-slate-50 flex items-center justify-center font-black text-slate-900 text-xl border border-slate-100 shadow-inner">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[15px] font-black text-slate-900 truncate tracking-tighter uppercase">{user?.username}</div>
              <div className="text-[14px] text-slate-400 font-black uppercase tracking-widest opacity-60">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-4 text-[13px] font-black uppercase tracking-[0.2em] bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 hover:bg-slate-100 rounded-[20px] transition-all active:scale-95"
          >
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden bg-white">
        {/* Header */}
        <header className="h-28 sticky top-0 flex items-center justify-between px-10 md:px-14 bg-white/80 backdrop-blur-2xl border-b border-slate-50 z-50">
          <div className="flex items-center gap-10 text-slate-900">
            <button
              className="md:hidden p-4 bg-slate-50 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div className="hidden md:block">
              <h1 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-300 flex items-center gap-4">
                 <span className="w-12 h-px bg-slate-100"></span>
                  {menuItems.find(m => location.pathname === m.path || (m.path !== '/' && location.pathname.startsWith(m.path)))?.label || t('nav.home')}
               </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            {/* 语言选择功能 */}
            <div className="flex bg-slate-50 p-1.5 rounded-[18px] border border-slate-100 shadow-inner">
              {['zh', 'en', 'id'].map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`px-5 py-2.5 rounded-[14px] text-[14px] font-black uppercase transition-all ${lang === l ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100' : 'text-slate-300 hover:text-slate-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4 py-3.5 px-8 bg-white border border-slate-100 rounded-full shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[14px] font-black text-slate-900 uppercase tracking-widest">{t('activeConnection')}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-10 md:p-14 no-scrollbar bg-white relative">
          <div className="max-w-[1500px] mx-auto w-full relative z-10 animate-soft pb-24">
            <Outlet />
          </div>
          
          {/* Spacer for mobile nav */}
          <div className="h-28 md:hidden"></div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-3xl border-t border-slate-100 flex justify-between items-center px-4 py-3 md:hidden z-[100] shadow-3xl shadow-slate-900/10">
          {(menuItems || []).slice(0, 7).map(item => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-slate-900 scale-105' : 'text-slate-300 opacity-50'}`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
