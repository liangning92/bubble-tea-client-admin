import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

export default function SettingsPage() {
  const { t, lang, user, logout, changeLang } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('system');

  // ========== 系统设置 ==========
  const [notificationEnabled, setNotificationEnabled] = useState(
    localStorage.getItem('notif_enabled') !== 'false'
  );
  const [autoRefresh, setAutoRefresh] = useState(
    localStorage.getItem('auto_refresh') === 'true'
  );
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'IDR');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('date_format') || 'yyyy-MM-dd');

  const handleSaveSystemSettings = () => {
    localStorage.setItem('notif_enabled', notificationEnabled);
    localStorage.setItem('auto_refresh', autoRefresh);
    localStorage.setItem('currency', currency);
    localStorage.setItem('date_format', dateFormat);
    alert(t('settingsSaved'));
  };

  const handleExportData = async () => {
    // 导出所有数据为JSON
    const endpoints = [
      { key: 'inventory', url: '/inventory' },
      { key: 'sales', url: '/sales' },
      { key: 'expenses', url: '/expenses' },
      { key: 'staff', url: '/staff' },
      { key: 'hygiene_records', url: '/hygiene/records?pageSize=1000' },
    ];
    const data = {};
    for (const ep of endpoints) {
      const res = await api('GET', ep.url);
      if (!res.error) data[ep.key] = res;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble-tea-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    const confirmText = t('clearDataConfirmText');
    if (!confirm(confirmText)) return;
    if (!confirm(t('clearDataConfirm'))) return;
    const res = await api('DELETE', '/data/business');
    if (res.error) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: res.error }));
    } else {
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('dataCleared') }));
    }
  };

  // ========== 用户管理 ==========
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'staff', name: '' });
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '' });

  const loadUsers = async () => {
    const data = await api('GET', '/staff/users');
    setUsers(data || []);
  };

  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const res = await api('POST', '/staff/users', userForm);
    if (res.error) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: res.error }));
      return;
    }
    setShowAddUser(false);
    setUserForm({ username: '', password: '', role: 'staff', name: '' });
    loadUsers();
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('userAdded') }));
  };

  const handleDeleteUser = async (id) => {
    if (!confirm(t.confirm + '?')) return;
    const res = await api('DELETE', `/staff/users/${id}`);
    if (res.error) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: res.error }));
    } else {
      loadUsers();
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('userDeleted') }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const res = await api('PUT', '/staff/users/' + user.id, { password: pwdForm.newPassword });
    if (res.error) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: res.error }));
      return;
    }
    setShowChangePwd(false);
    setPwdForm({ oldPassword: '', newPassword: '' });
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('passwordChanged') }));
  };

  // ========== 日志 ==========
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadLogs = async () => {
    const data = await api('GET', `/logs?startDate=${startDate}&endDate=${endDate}&type=${logFilter}`);
    setLogs(data || []);
  };

  useEffect(() => { if (activeTab === 'logs') loadLogs(); }, [activeTab, startDate, endDate, logFilter]);

  const handleClearLogs = async () => {
    if (!confirm(t('clearLogsConfirm'))) return;
    const res = await api('DELETE', '/logs');
    if (res?.error) return;
    loadLogs();
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('logCleared') }));
  };

  // ========== 智能导入 ==========
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [smartImportText, setSmartImportText] = useState('');
  const [importResult, setImportResult] = useState(null);

  const handleSmartImport = async (e) => {
    e.preventDefault();
    if (!smartImportText.trim()) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: t('enterImportContent') }));
      return;
    }
    const result = await api('POST', '/import/smart', { text: smartImportText });
    if (result?.error) return;
    setImportResult(result);
    setSmartImportText('');
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('importSuccessCustom') }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/import/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.error) alert(result.error);
      else setImportResult(result);
    } catch (err) {
      alert(t('uploadFailed') + err.message);
    }
    e.target.value = '';
  };

  const tabs = [
    { key: 'system', zh: '系统设置', id: 'Pengaturan Sistem' },
    { key: 'users', zh: '账户管理', id: 'Manajemen Akun' },
    { key: 'logs', zh: '操作日志', id: 'Riwayat Aktivitas' },
    { key: 'import', zh: '智能导入', id: 'Import Cerdas' },
    { key: 'guide', zh: '使用指南', id: 'Panduan' },
  ];

  const roleLabels = {
    admin: t('roleAdmin'),
    manager: t('roleManager'),
    staff: t('roleStaff'),
  };

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t('titleSystemSettings')}</h1>
      </div>

      {/* 当前用户信息 */}
      <div className="card mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">👤</div>
          <div>
            <div className="font-bold">{user?.name || user?.username}</div>
            <div className="text-xs text-gray-500">{roleLabels[user?.role] || user?.role}</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowChangePwd(true)} className="btn btn-secondary btn-sm">
              🔐 {t('btnChangePassword')}
            </button>
            <button onClick={logout} className="btn btn-danger btn-sm">{t.logout}</button>
          </div>
        </div>
      </div>

      {showChangePwd && (
        <div className="card mb-4">
          <h3 className="font-bold mb-3">{t('titleChangePassword')}</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input className="input" type="password" placeholder={t('placeholderOldPassword')} value={pwdForm.oldPassword} onChange={e => setPwdForm({...pwdForm, oldPassword: e.target.value})} required />
            <input className="input" type="password" placeholder={t('placeholderNewPassword')} value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} required />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1">{t.confirm}</button>
              <button type="button" onClick={() => setShowChangePwd(false)} className="btn btn-secondary">{t.cancel}</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => {
            setActiveTab(tab.key);
            if (tab.key === 'guide') navigate('/settings/guide');
          }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {lang === 'zh' ? tab.zh : tab.id}
          </button>
        ))}
      </div>

      {/* ========== 系统设置 ========== */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* 语言 */}
          <div className="card">
            <h3 className="font-bold mb-3">🌐 {t('titleLanguageSettings')}</h3>
            <div className="flex gap-2">
              {[
                { code: 'zh', label: '🇨🇳 中文', name: '中文' },
                { code: 'id', label: '🇮🇩 Bahasa Indonesia', name: '印尼语' },
                { code: 'en', label: '🇬🇧 English', name: '英语' },
              ].map(l => (
                <button key={l.code}
                  onClick={() => changeLang(l.code)}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium border-2 ${lang === l.code ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div>{l.label}</div>
                  <div className="text-xs text-gray-400">{l.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 通知设置 */}
          <div className="card">
            <h3 className="font-bold mb-3">🔔 {t('titleNotificationSettings')}</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>{t('labelEnableNotifications')}</span>
                <input type="checkbox" className="toggle" checked={notificationEnabled}
                  onChange={e => setNotificationEnabled(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between">
                <span>{t('labelAutoRefreshData')}</span>
                <input type="checkbox" className="toggle" checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)} />
              </label>
            </div>
          </div>

          {/* 货币与日期 */}
          <div className="card">
            <h3 className="font-bold mb-3">💰 {t('titleDisplaySettings')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>{t('labelCurrency')}</span>
                <select className="input w-32" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('labelDateFormat')}</span>
                <select className="input w-40" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                  <option value="yyyy-MM-dd">2026-04-05</option>
                  <option value="dd/MM/yyyy">05/04/2026</option>
                  <option value="MM/dd/yyyy">04/05/2026</option>
                </select>
              </div>
            </div>
          </div>

          {/* 数据管理 */}
          <div className="card">
            <h3 className="font-bold mb-3">💾 {t('titleDataManagement')}</h3>
            <div className="space-y-4">
              <button onClick={handleExportData} className="btn btn-secondary w-full text-left justify-start">
                📤 {t('btnExportAllData')}
              </button>
              <button onClick={handleClearData} className="btn btn-danger w-full text-left justify-start">
                🗑️ {t('btnClearBusinessData')}
              </button>
            </div>
          </div>

          <button onClick={handleSaveSystemSettings} className="btn btn-primary w-full">
            💾 {t('btnSaveSettings')}
          </button>
        </div>
      )}

      {/* ========== 账户管理 ========== */}
      {activeTab === 'users' && (
        <>
          {user?.role === 'admin' && (
            <div className="flex gap-2 mb-4">
              <button onClick={() => setShowAddUser(true)} className="btn btn-primary btn-sm">
                + {t('btnAddUser')}
              </button>
            </div>
          )}

          {showAddUser && (
            <div className="card mb-4">
              <h3 className="font-bold mb-3">{t('btnAddUser')}</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <input className="input" placeholder={t('placeholderName')} value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                <input className="input" placeholder={t.username} value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                <input className="input" type="password" placeholder={t.password} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                <select className="input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                  <option value="staff">{t('roleStaff')}</option>
                  {user?.role === 'admin' && <option value="admin">{t('roleAdmin')}</option>}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">{t.save}</button>
                  <button type="button" onClick={() => setShowAddUser(false)} className="btn btn-secondary">{t.cancel}</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="card">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">👤</div>
                    <div>
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-gray-400">{u.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-4 py-0.5 rounded ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                    {user?.role === 'admin' && u.id !== user?.id && (
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 text-xs hover:text-red-600">✕</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========== 操作日志 ========== */}
      {activeTab === 'logs' && (
        <>
          <div className="card mb-4">
            <div className="flex gap-2 items-center">
              <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-gray-400">—</span>
              <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-2">
              {['all', 'login', 'create', 'update', 'delete'].map(f => (
                <button key={f} onClick={() => setLogFilter(f)}
                  className={`px-4 py-1 rounded text-xs ${logFilter === f ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {(f === 'all' ? t('labelAll') : f === 'login' ? t('labelLogin') : f === 'create' ? t('labelCreate') : f === 'update' ? t('labelUpdate') : t('labelDelete'))}
                </button>
              ))}
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">{t.noRecords}</p>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-4 py-0.5 rounded ${
                          log.action === 'login' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'create' ? 'bg-green-100 text-green-700' :
                          log.action === 'update' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-sm">{log.target}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {log.username} | {new Date(log.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Jakarta' })}
                      </div>
                      {log.details && <div className="text-xs text-gray-500 mt-1">{log.details}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========== 智能导入 ========== */}
      {activeTab === 'import' && (
        <>
          <div className="card mb-4">
            <h3 className="font-bold mb-2">{t('titleSmartImport')}</h3>

            {/* 文件上传 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt,.xlsx,.xls,.csv,.docx,.pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📎</div>
                <div className="text-sm text-gray-600 mb-1">
                  {t('btnClickUploadFile')}
                </div>
                <div className="text-xs text-gray-400">
                  {t('labelFormatSupport')}
                </div>
              </label>
            </div>

            <div className="text-xs text-gray-400 mb-4 text-center">
              {t('labelFormatDetail')}
            </div>

            <div className="text-center text-gray-400 mb-3">{t('labelOrEnterText')}</div>

            <form onSubmit={handleSmartImport}>
              <textarea
                className="input mb-3"
                rows={5}
                placeholder={t('placeholderSmartImport')}
                value={smartImportText}
                onChange={e => setSmartImportText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary w-full">
                {t('labelImportText')}
              </button>
            </form>
          </div>

          {importResult && (
            <div className="card mb-4 bg-green-50">
              <h4 className="font-bold mb-2 text-green-700">{t('titleImportResult')}</h4>
              <pre className="text-xs text-green-600 whitespace-pre-wrap">{importResult.summary}</pre>
              {importResult.fileType && (
                <div className="text-xs text-gray-500 mt-1">
                  {t('labelFileType')}: {importResult.fileType}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {importResult.results?.trainings?.imported > 0 && (
                  <button onClick={() => navigate('/staff')} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600">👥 {t('btnViewTraining')} ({importResult.results.trainings.imported})</button>
                )}
                {importResult.results?.hygieneTasks?.imported > 0 && (
                  <button onClick={() => navigate('/hygiene/tasks')} className="px-3 py-1.5 bg-cyan-500 text-white text-xs rounded-lg hover:bg-cyan-600">🧹 {t('btnViewHygieneTasks')} ({importResult.results.hygieneTasks.imported})</button>
                )}
                {importResult.results?.expenses?.imported > 0 && (
                  <button onClick={() => navigate('/expense')} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">💰 {t('btnViewExpenses')} ({importResult.results.expenses.imported})</button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
