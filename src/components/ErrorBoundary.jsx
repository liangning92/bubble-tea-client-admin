import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Crash caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const lang = localStorage.getItem('lang') || 'zh';
      const content = {
        zh: {
          title: '组件加载失败',
          desc: '很抱歉，当前模块在加载时遇到了意外。这通常是因为网络波动或数据同步导致的局部故障，其他模块仍可正常使用。',
          reload: '尝试重新加载页面',
          ignore: '忽略此错误',
          details: '错误详情'
        },
        en: {
          title: 'Module Load Failed',
          desc: 'Sorry, the current module encountered an unexpected error. This is usually a temporary issue due to network or sync. Other parts remain functional.',
          reload: 'Reload Page',
          ignore: 'Ignore Error',
          details: 'Technical Details'
        },
        id: {
          title: 'Gagal Memuat Modul',
          desc: 'Maaf, modul saat ini mengalami kesalahan tak terduga. Ini biasanya masalah sementara karena jaringan atau sinkronisasi. Bagian lain tetap berfungsi.',
          reload: 'Muat Ulang Halaman',
          ignore: 'Abaikan Kesalahan',
          details: 'Detail Teknis'
        }
      }[lang] || {
          title: '组件加载失败',
          desc: '很抱歉，当前模块在加载时遇到了意外。这通常是因为网络波动或数据同步导致的局部故障，其他模块仍可正常使用。',
          reload: '尝试重新加载页面',
          ignore: '忽略此错误',
          details: '错误详情'
        };

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-rose-50 rounded-[32px] border border-rose-100 animate-soft">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            {content.title}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 font-medium">
            {content.desc}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
            >
              🔄 {content.reload}
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-8 py-3 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-rose-100 transition-all"
            >
              {content.ignore}
            </button>
          </div>
          <details className="mt-8 text-left max-w-xl mx-auto opacity-30 hover:opacity-100 transition-all">
            <summary className="text-[14px] font-black cursor-pointer uppercase tracking-[0.2em] text-slate-400">{content.details}</summary>
            <pre className="mt-4 p-4 bg-slate-800 text-slate-100 rounded-xl text-[14px] overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;