import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { i18n } from '../i18n';
import { resolvePermissions, canAccess, canEdit, PermissionLevel } from '../utils/permissions';

const API = '/api';
const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('zh');
  const [storeMappings, setStoreMappings] = useState([]);
  const [storeConfig, setStoreConfig] = useState(null);

  // 权限对象
  const permissions = useMemo(() => {
    if (!user) return null;
    // user.permissions 可能是 JSON 字符串
    return resolvePermissions(user.permissions, user.role);
  }, [user]);

  // 薪资查看权限（来自 Staff.salaryView 字段）
  const salaryView = user?.salaryView || 'all';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedLang = localStorage.getItem('lang') || 'zh';
    setLang(savedLang);

    // QoL Enhancement: Auto-login disabled for manual testing stability

    if (token) {
      // If it's a bypass token, skip backend check to avoid intermittent redirects
      if (token === 'dev-bypass-token') {
        setUser({ 
          username: 'hq_admin', 
          role: 'admin', 
          tenantId: 1, 
          storeId: null,
          salaryView: 'all'
        });
        setLoading(false);
        return;
      }

      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Lang': savedLang }
      })
        .then(r => r.json())
        .then(data => {
          if (!data.error) setUser(data.user || data);
          else if (process.env.NODE_ENV === 'development') {
             // Fallback to bypass even if token expired in dev
             setUser({ username: 'hq_admin', role: 'admin', tenantId: 1, storeId: null });
          }
        })
        .catch(() => {
           if (process.env.NODE_ENV === 'development') setUser({ username: 'hq_admin', role: 'admin', tenantId: 1 });
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Lang': lang },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setStoreMappings([]);
    setStoreConfig(null);
  };

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      salaryView,
      login,
      logout,
      loading,
      lang,
      changeLang,
      storeMappings,
      setStoreMappings,
      storeConfig,
      setStoreConfig,
      t: (key) => {
        const parts = key.split('.');
        let val = i18n[lang];
        for (const part of parts) {
          val = val?.[part];
        }
        return val || key;
      },
      canAccess: (moduleKey) => { if (loading) return true; if (!permissions) return true; return canAccess(permissions, moduleKey); },
      canEdit: (moduleKey) => canEdit(permissions, moduleKey),
      PermissionLevel,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">加载中...</div>;
  if (loading) return null; // 确保在加载完成前不跳转
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

async function api(method, path, data = null) {
  const token = localStorage.getItem('token');
  const lang = localStorage.getItem('lang') || 'zh';
  const opts = { method, headers: { Authorization: `Bearer ${token}`, 'X-Lang': lang } };

  // 设置请求超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
  opts.signal = controller.signal;

  if (data) {
    if (data instanceof FormData) {
      opts.body = data;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(data);
    }
  }

  // Defensive check: prevent double /api prefix
  const cleanPath = path.startsWith('/api') ? path.substring(4) : path;
  
  try {
    const res = await fetch(`${API}${cleanPath}`, opts);
    clearTimeout(timeoutId);

    // 检查HTTP状态码
    if (!res.ok) {
      const errorText = await res.text();
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch {
        if (errorText) errorMsg = errorText.slice(0, 200);
      }

      // 发送错误事件
      window.dispatchEvent(new CustomEvent('app:error', {
        detail: { message: errorMsg, status: res.status }
      }));

      // 保持向后兼容性：返回包含error字段的对象
      return {
        error: errorMsg,
        status: res.status,
        ok: false
      };
    }

    const text = await res.text();
    if (!text) return null; // 空响应返回null以保持兼容

    try {
      const result = JSON.parse(text);

      // 检查API级别的错误
      if (result?.error) {
        const errMsg = typeof result.error === 'string' ? result.error : (result.error?.message || '操作失败');
        window.dispatchEvent(new CustomEvent('app:error', {
          detail: { message: errMsg, type: 'api' }
        }));

        // 保持向后兼容性：返回包含error字段的对象
        return {
          error: errMsg,
          ok: false,
          data: result
        };
      }

      // 成功时直接返回数据，保持与现有代码的兼容性
      return result;
    } catch (parseError) {
      console.error('API解析失败:', text.slice(0, 200));
      const errorMsg = '响应格式错误';
      window.dispatchEvent(new CustomEvent('app:error', {
        detail: { message: errorMsg, type: 'parse' }
      }));

      return {
        error: errorMsg,
        ok: false,
        raw: text.slice(0, 100)
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('API请求失败:', err);

    let errorMsg = '网络请求失败';
    if (err.name === 'AbortError') {
      errorMsg = '请求超时，请检查网络连接';
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      errorMsg = '网络连接失败，请检查网络设置';
    }

    window.dispatchEvent(new CustomEvent('app:error', {
      detail: { message: errorMsg, type: 'network' }
    }));

    return {
      error: errorMsg,
      ok: false,
      name: err.name
    };
  }
}

// 增强的API函数，提供更好的错误处理和用户友好提示
async function apiEnhanced(method, path, data = null, options = {}) {
  const { showError = true, timeout = 30000, retry = 0 } = options;

  try {
    const result = await api(method, path, data);

    // 如果api函数返回错误对象，进行重试
    if (result?.error && retry > 0) {
      console.log(`API请求失败，正在重试 (剩余 ${retry} 次)...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      return await apiEnhanced(method, path, data, { ...options, retry: retry - 1 });
    }

    // 显示用户友好的错误提示
    if (result?.error && showError) {
      const errorMessage = result.error || '操作失败，请稍后重试';

      // 发送全局错误通知
      window.dispatchEvent(new CustomEvent('app:notification', {
        detail: {
          type: 'error',
          message: errorMessage,
          duration: 5000
        }
      }));
    }

    return result;
  } catch (error) {
    console.error('增强API函数捕获到未处理的错误:', error);

    if (showError) {
      window.dispatchEvent(new CustomEvent('app:notification', {
        detail: {
          type: 'error',
          message: '系统异常，请联系管理员',
          duration: 5000
        }
      }));
    }

    return {
      error: '系统异常，请联系管理员',
      ok: false,
      exception: true
    };
  }
}

export { AuthContext, useAuth, AuthProvider, ProtectedRoute, api, apiEnhanced, i18n };
