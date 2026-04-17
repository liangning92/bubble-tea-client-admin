import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, changeLang, lang, t } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // QoL: Dev mode auto-fill requested by user to speed up testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setUsername('admin');
      setPassword('admin123');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError(t('invalidCredentials'));
    }
  };

  const langs = [
    { code: 'zh', label: '中文' },
    { code: 'id', label: 'Indonesia' },
    { code: 'en', label: 'English' },
  ];

  const features = [
    { icon: '💰', title: t('loginFeature1Title'), desc: t('loginFeature1Desc') },
    { icon: '📦', title: t('loginFeature2Title'), desc: t('loginFeature2Desc') },
    { icon: '👥', title: t('loginFeature3Title'), desc: t('loginFeature3Desc') },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>

      {/* ===== 左侧品牌区 ===== */}
      <div style={{
        display: 'none',
        width: '45%',
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #ffffff 0%, #fff7ed 50%, #ffedd5 100%)',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid #fed7aa',
      }}
        className="login-left-panel">

        {/* 背景装饰 */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(255,119,0,0.08), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(251,191,36,0.05), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.15)',
              border: '1px solid #f97316'
            }}>
              <img src="/shopwise-brand-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Shopwise" />
            </div>
            <div>
              <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '24px', letterSpacing: '-1px', lineHeight: 1 }}>Shopwise</div>
              <div style={{ color: '#ea580c', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>门店智能管理系统</div>
            </div>
          </div>
        </div>

        {/* 核心文案 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            color: '#0f172a', fontWeight: 900, fontSize: '48px',
            lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '20px',
          }}>
            {lang === 'zh' ? <>智能掌控<br /><span style={{ color: '#FF7700' }}>连锁店业务</span></> : <>Total Control<br /><span style={{ color: '#FF7700' }}>Store Ops</span></>}
          </h1>
          <p style={{ color: '#44403c', fontSize: '16px', fontWeight: 500, lineHeight: 1.6, marginBottom: '48px' }}>
            {lang === 'zh' ? '专为高增长品牌打造的一体化门店管理系统' : 'All-in-one store management system for high-growth brands'}
          </p>

          {/* 功能亮点 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(255,119,0,0.1)',
                  border: '1px solid rgba(255,119,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
                }}>{f.icon}</div>
                <div>
                  <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '13px' }}>{f.title}</div>
                  <div style={{ color: '#78716c', fontSize: '12px', marginTop: '2px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 */}
        <div style={{ position: 'relative', zIndex: 1, color: 'rgba(120,113,108,0.8)', fontSize: '11px', fontWeight: 600 }}>
          © 2026 Shopwise · All rights reserved
        </div>
      </div>

      {/* ===== 右侧登录区 ===== */}
      <div style={{
        flex: 1,
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* 移动端 Logo（<= 1024px 显示） */}
          <div className="login-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              border: '1px solid #fed7aa', shadow: '0 4px 12px rgba(255,119,0,0.1)'
            }}>
              <img src="/shopwise-brand-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Shopwise" />
            </div>
            <div>
              <div style={{ color: '#1c1917', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px', lineHeight: 1 }}>Shopwise</div>
              <div style={{ color: '#f97316', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>门店智能管理系统</div>
            </div>
          </div>

          {/* 标题 */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: '32px', letterSpacing: '-1px', margin: 0 }}>
              {lang === 'zh' ? '欢迎回来' : lang === 'id' ? 'Selamat Datang' : 'Welcome Back'}
            </h2>
            <p style={{ color: '#78716c', fontSize: '14px', fontWeight: 500, marginTop: '8px' }}>
              {lang === 'zh' ? '请输入您的工作账号继续' : lang === 'id' ? 'Masukkan akun kerja Anda' : 'Sign in to your workspace'}
            </p>
          </div>

          {/* 语言切换 */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '28px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '14px', padding: '5px',
          }}>
            {langs.map(l => (
              <button key={l.code} onClick={() => changeLang(l.code)} style={{
                flex: 1, padding: '10px 4px', borderRadius: '10px',
                border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                transition: 'all 0.2s',
                background: lang === l.code
                  ? '#ffffff'
                  : 'transparent',
                color: lang === l.code ? '#FF7700' : '#a8a29e',
                boxShadow: lang === l.code ? '0 4px 12px rgba(255,119,0,0.1)' : 'none',
              }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* 用户名 */}
            <div>
              <label style={{ display: 'block', color: '#78716c', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {lang === 'zh' ? '账号' : lang === 'id' ? 'Akun' : 'Username'}
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder={lang === 'zh' ? '请输入用户名' : lang === 'id' ? 'Masukkan username' : 'Enter username'}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '16px 20px',
                  background: '#fffaf5',
                  border: '1px solid #fed7aa',
                  borderRadius: '14px',
                  color: '#0f172a',
                  fontSize: '15px',
                  fontWeight: 500,
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#FF7700'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(255, 119, 0, 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#fed7aa'; e.target.style.background = '#fffaf5'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* 密码 */}
            <div>
              <label style={{ display: 'block', color: '#78716c', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {lang === 'zh' ? '密码' : lang === 'id' ? 'Kata Sandi' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={lang === 'zh' ? '请输入密码' : lang === 'id' ? 'Masukkan kata sandi' : 'Enter password'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '16px 50px 16px 20px',
                    background: '#fffaf5',
                    border: '1px solid #fed7aa',
                    borderRadius: '14px',
                    color: '#0f172a',
                    fontSize: '15px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#FF7700'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(255, 119, 0, 0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#fed7aa'; e.target.style.background = '#fffaf5'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '16px', padding: 0, lineHeight: 1,
                }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* 错误 */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px',
                marginTop: '8px',
                background: loading ? 'rgba(255,119,0,0.4)' : '#FF7700',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '14px', fontWeight: 800,
                letterSpacing: '1.5px', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 8px 32px rgba(255, 119, 0, 0.3)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              {loading && (
                <span style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {loading
                ? (lang === 'zh' ? '正在验证...' : lang === 'id' ? 'Memverifikasi...' : 'Signing in...')
                : (lang === 'zh' ? '登录工作台' : lang === 'id' ? 'Masuk' : 'Sign In')}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: '#78716c', fontSize: '12px', fontWeight: 600, marginTop: '32px' }}>
            {lang === 'zh' ? '如需注册账号，请联系系统管理员' : lang === 'id' ? 'Hubungi admin untuk membuat akun' : 'Contact admin to create an account'}
          </p>
        </div>
      </div>

      {/* 响应式 CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* 桌面：显示左侧品牌区 */
        @media (min-width: 1024px) {
          .login-left-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
        
        /* 移动和平板：隐藏左侧，显示移动端 Logo */  
        @media (max-width: 1023px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
        
        input::placeholder { color: rgba(148,163,184,0.35); }
      `}</style>
    </div>
  );
}
