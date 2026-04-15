import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

export default function SettingsPage() {
  const { t, lang, user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  // ========== 用户管理 ==========
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'staff', name: '' });
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '' });
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [smartImportText, setSmartImportText] = useState('');
  const [importResult, setImportResult] = useState(null);

  // ========== 智能运营配置 ==========
  const [config, setConfig] = useState({
    smartOpsBuffer: 5,
    profitMarginFloor: 25,
    lowStockThreshold: 3,
    deviationThreshold: 10,
    alertEnabled: true
  });

  // ========== 翻译映射 ==========
  const [mappings, setMappings] = useState([]);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [mappingForm, setMappingForm] = useState({ sourceText: '', translatedText: '', targetLang: 'zh', category: 'product' });

  const loadConfig = async () => {
    const data = await api('GET', '/system/config');
    if (data && !data.error) setConfig(data);
  };

  const loadMappings = async () => {
    const data = await api('GET', '/system/mappings');
    setMappings(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (activeTab === 'smart-ops') loadConfig();
    if (activeTab === 'mappings') loadMappings();
  }, [activeTab]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const res = await api('POST', '/system/config', config);
    if (!res.error) {
      window.dispatchEvent(new CustomEvent('app:success', { detail: lang === 'zh' ? '全局配置已保存' : 'Konfigurasi disimpan' }));
    }
  };

  const handleAddMapping = async (e) => {
    e.preventDefault();
    const res = await api('POST', '/system/mappings', mappingForm);
    if (!res.error) {
      setShowAddMapping(false);
      setMappingForm({ sourceText: '', translatedText: '', targetLang: 'zh', category: 'product' });
      loadMappings();
      window.dispatchEvent(new CustomEvent('app:success', { detail: lang === 'zh' ? '映射已添加' : 'Pemetaan ditambahkan' }));
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!confirm(t.confirm + '?')) return;
    const res = await api('DELETE', `/system/mappings/${id}`);
    if (!res.error) loadMappings();
  };

  const loadUsers = async () => {
    const data = await api('GET', '/staff/users');
    setUsers(Array.isArray(data) ? data : (data?.data || []));
  };

  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const res = await api('POST', '/staff/users', userForm);
    if (res?.error) return;
    setShowAddUser(false);
    setUserForm({ username: '', password: '', role: 'staff', name: '' });
    loadUsers();
    window.dispatchEvent(new CustomEvent('app:success', { detail: lang === 'zh' ? '用户已添加' : 'Pengguna ditambahkan' }));
  };

  const handleDeleteUser = async (id) => {
    if (!confirm(t.confirm + '?')) return;
    const res = await api('DELETE', `/staff/users/${id}`);
    if (res?.error) return;
    loadUsers();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const res = await api('PUT', '/staff/users/' + user.id, { password: pwdForm.newPassword });
    if (res?.error) return;
    setShowChangePwd(false);
    setPwdForm({ oldPassword: '', newPassword: '' });
    window.dispatchEvent(new CustomEvent('app:success', { detail: lang === 'zh' ? '密码已修改' : 'Kata sandi diubah' }));
  };

  const handleSmartImport = async (e) => {
    e.preventDefault();
    if (!smartImportText.trim()) {
      alert(lang === 'zh' ? '请输入导入内容' : 'Masukkan konten');
      return;
    }
    const result = await api('POST', '/import/smart', { text: smartImportText });
    setImportResult(result);
    setSmartImportText('');
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
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.error) {
        alert(result.error);
      } else {
        setImportResult(result);
      }
    } catch (err) {
      alert(lang === 'zh' ? '上传失败: ' + err.message : 'Upload gagal: ' + err.message);
    }
    e.target.value = '';
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
    setLogs(Array.isArray(data) ? data : (data?.data || []));
  };

  useEffect(() => { if (activeTab === 'logs') loadLogs(); }, [activeTab, startDate, endDate, logFilter]);

  const handleClearLogs = async () => {
    if (!confirm(lang === 'zh' ? '确定要清空所有日志吗？' : 'Yakin ingin hapus semua log?')) return;
    const res = await api('DELETE', '/logs');
    if (res?.error) return;
    loadLogs();
    window.dispatchEvent(new CustomEvent('app:success', { detail: lang === 'zh' ? '日志已清空' : 'Log dihapus' }));
  };

  const getActionColor = (action) => {
    if (action === 'login' || action === 'logout') return 'bg-blue-100 text-blue-700';
    if (action === 'create' || action === 'add') return 'bg-green-100 text-green-700';
    if (action === 'delete' || action === 'remove') return 'bg-red-100 text-red-700';
    if (action === 'update' || action === 'edit') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getLogIcon = (action) => {
    if (action === 'login') return '🔑';
    if (action === 'logout') return '🚪';
    if (action === 'create' || action === 'add') return '➕';
    if (action === 'delete' || action === 'remove') return '🗑️';
    if (action === 'update' || action === 'edit') return '✏️';
    return '📋';
  };

  const roleLabels = {
    admin: lang === 'zh' ? '管理员' : 'Admin',
    manager: lang === 'zh' ? '经理' : 'Manajer',
    staff: lang === 'zh' ? '员工' : 'Staf',
  };

  const tabs = [
    { key: 'users', zh: '账户管理', id: 'Manajemen Akun' },
    { key: 'smart-ops', zh: '智能运营', id: 'Smart Ops' },
    { key: 'mappings', zh: '翻译设置', id: 'Translation' },
    { key: 'logs', zh: '操作日志', id: 'Riwayat Aktivitas' },
    { key: 'import', zh: '智能导入', id: 'Import Cerdas' },
  ];

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{lang === 'zh' ? '系统设置' : 'Pengaturan'}</h1>
      </div>

      {/* 当前用户信息 */}
      <div className="card mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">👤</div>
          <div>
            <div className="font-bold">{user?.name || user?.username}</div>
            <div className="text-[14px] text-gray-500">{roleLabels[user?.role] || user?.role}</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowChangePwd(true)} className="btn btn-secondary btn-sm">
              🔐 {lang === 'zh' ? '改密码' : 'Ganti Sandi'}
            </button>
            <button onClick={logout} className="btn btn-danger btn-sm">{t.logout}</button>
          </div>
        </div>
      </div>

      {showChangePwd && (
        <div className="card mb-4">
          <h3 className="font-bold mb-3">{lang === 'zh' ? '修改密码' : 'Ubah Kata Sandi'}</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input className="input" type="password" placeholder={lang === 'zh' ? '旧密码' : 'Sandi Lama'} value={pwdForm.oldPassword} onChange={e => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} required />
            <input className="input" type="password" placeholder={lang === 'zh' ? '新密码' : 'Sandi Baru'} value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} required />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1">{t.confirm}</button>
              <button type="button" onClick={() => setShowChangePwd(false)} className="btn btn-secondary">{t.cancel}</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-1 mb-4">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {lang === 'zh' ? tab.zh : tab.id}
          </button>
        ))}
      </div>

      {/* ========== 账户管理 ========== */}
      {activeTab === 'users' && (
        <>
          {user?.role === 'admin' && (
            <div className="flex gap-2 mb-4">
              <button onClick={() => setShowAddUser(true)} className="btn btn-primary btn-sm">
                + {lang === 'zh' ? '添加用户' : 'Tambah Pengguna'}
              </button>
            </div>
          )}

          {showAddUser && (
            <div className="card mb-4">
              <h3 className="font-bold mb-3">{lang === 'zh' ? '添加用户' : 'Tambah Pengguna'}</h3>
              <form onSubmit={handleAddUser} className="space-y-3">
                <input className="input" placeholder={lang === 'zh' ? '姓名' : 'Nama'} value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                <input className="input" placeholder={t.username} value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required />
                <input className="input" type="password" placeholder={t.password} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />
                <select className="input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="staff">{lang === 'zh' ? '员工' : 'Staf'}</option>
                  {user?.role === 'admin' && <option value="admin">{lang === 'zh' ? '管理员' : 'Admin'}</option>}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">{t.save}</button>
                  <button type="button" onClick={() => setShowAddUser(false)} className="btn btn-secondary">{t.cancel}</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="card">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">👤</div>
                    <div>
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-[14px] text-gray-400">{u.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[14px] px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                    {user?.role === 'admin' && u.id !== user?.id && (
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 text-[14px] hover:text-red-600">✕</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========== 智能导入 ==========*/}
      {activeTab === 'import' && (
        <>
          <div className="card mb-4">
            <h3 className="font-bold mb-2">{lang === 'zh' ? '🤖 智能批量导入' : '🤖 Import Batch Cerdas'}</h3>

            {/* 文件上传区域 */}
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
                  {lang === 'zh' ? '点击上传文件' : 'Klik untuk upload file'}
                </div>
                <div className="text-[14px] text-gray-400">
                  {lang === 'zh'
                    ? '支持: TXT, Excel, Word, PDF, 图片'
                    : 'Mendukung: TXT, Excel, Word, PDF, Gambar'}
                </div>
              </label>
            </div>

            <div className="text-[14px] text-gray-400 mb-4 text-center">
              {lang === 'zh'
                ? '📄 支持格式: txt, xlsx, xls, csv, docx, pdf, png, jpg, jpeg | 图片将自动OCR识别文字'
                : '📄 Format: txt, xlsx, xls, csv, docx, pdf, png, jpg, jpeg | Gambar akan dikenali OCR'}
            </div>

            <div className="text-center text-gray-400 mb-3">{lang === 'zh' ? '或输入文本' : 'atau masukkan teks'}</div>

            <form onSubmit={handleSmartImport}>
              <textarea
                className="input mb-3"
                rows={5}
                placeholder={lang === 'zh'
                  ? '培训：食品安全培训\n清洁柜台 - 每日\n房租 Rp 5000000'
                  : 'Pelatihan: Keamanan Makanan\nBersihkan Etalase - Harian\nBiaya Sewa Rp 5000000'}
                value={smartImportText}
                onChange={e => setSmartImportText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary w-full">
                {lang === 'zh' ? '导入文本' : 'Import Teks'}
              </button>
            </form>
          </div>

          {importResult && (
            <div className="card mb-4 bg-green-50">
              <h4 className="font-bold mb-2 text-green-700">{lang === 'zh' ? '导入结果' : 'Hasil Import'}</h4>
              <pre className="text-[14px] text-green-600 whitespace-pre-wrap">{importResult.summary}</pre>
              {importResult.fileType && (
                <div className="text-[14px] text-gray-500 mt-1">
                  {lang === 'zh' ? '文件类型' : 'Tipe file'}: {importResult.fileType}
                </div>
              )}

              {/* 快捷跳转按钮 */}
              <div className="mt-3 flex flex-wrap gap-2">
                {importResult.results?.trainings?.imported > 0 && (
                  <button
                    onClick={() => navigate('/staff')}
                    className="px-3 py-1.5 bg-blue-500 text-white text-[14px] rounded-lg hover:bg-blue-600 flex items-center gap-1"
                  >
                    👥 {lang === 'zh' ? '查看培训' : 'Lihat Pelatihan'} ({importResult.results.trainings.imported})
                  </button>
                )}
                {importResult.results?.hygieneTasks?.imported > 0 && (
                  <button
                    onClick={() => navigate('/hygiene')}
                    className="px-3 py-1.5 bg-cyan-500 text-white text-[14px] rounded-lg hover:bg-cyan-600 flex items-center gap-1"
                  >
                    🧹 {lang === 'zh' ? '查看卫生任务' : 'Lihat Kebersihan'} ({importResult.results.hygieneTasks.imported})
                  </button>
                )}
                {importResult.results?.products?.imported > 0 && (
                  <button
                    onClick={() => navigate('/inventory')}
                    className="px-3 py-1.5 bg-orange-500 text-white text-[14px] rounded-lg hover:bg-orange-600 flex items-center gap-1"
                  >
                    📦 {lang === 'zh' ? '查看产品/配方' : 'Lihat Produk'} ({importResult.results.products.imported})
                  </button>
                )}
                {importResult.results?.expenses?.imported > 0 && (
                  <button
                    onClick={() => navigate('/expense')}
                    className="px-3 py-1.5 bg-red-500 text-white text-[14px] rounded-lg hover:bg-red-600 flex items-center gap-1"
                  >
                    💰 {lang === 'zh' ? '查看费用' : 'Lihat Biaya'} ({importResult.results.expenses.imported})
                  </button>
                )}
              </div>

              {importResult.results?.details?.length > 0 && (
                <div className="mt-3 space-y-1 max-h-48 overflow-y-auto border-t pt-2">
                  <div className="text-[14px] text-gray-500 mb-1">{lang === 'zh' ? '详情列表' : 'Daftar Detail'}:</div>
                  {importResult.results.details.map((d, i) => (
                    <div key={i} className={`text-[14px] ${d.status === 'success' ? 'text-green-600' : d.status === 'skipped' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {d.status === 'success' ? '✅' : d.status === 'skipped' ? '⏭️' : '❌'} {d.type}: {d.name}
                      {d.reason && <span className="text-gray-400"> ({d.reason})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========== 操作日志 ==========*/}
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
                  className={`px-2 py-1 rounded text-[14px] ${logFilter === f ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {f === 'all' ? (lang === 'zh' ? '全部' : 'Semua') :
                    f === 'login' ? (lang === 'zh' ? '登录' : 'Login') :
                      f === 'create' ? (lang === 'zh' ? '创建' : 'Buat') :
                        f === 'update' ? (lang === 'zh' ? '修改' : 'Edit') :
                          (lang === 'zh' ? '删除' : 'Hapus')}
                </button>
              ))}
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">{t.noRecords}</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[14px] px-2 py-0.5 rounded ${log.action === 'login' ? 'bg-blue-100 text-blue-700' :
                            log.action === 'create' ? 'bg-green-100 text-green-700' :
                              log.action === 'update' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                          }`}>
                          {log.action}
                        </span>
                        <span className="text-sm">{log.target}</span>
                      </div>
                      <div className="text-[14px] text-gray-400">
                        {log.username} | {new Date(log.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Jakarta' })}
                      </div>
                      {log.details && <div className="text-[14px] text-gray-500 mt-1">{log.details}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
