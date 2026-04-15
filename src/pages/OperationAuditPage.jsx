import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function OperationAuditPage() {
  const { t, lang } = useAuth();
  const [activeTab, setActiveTab] = useState('sop');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [sopTasks, setSopTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 五大维度分类
  const categories = [
    { key: 'sop', label: t('hygieneSOP', '每日 SOP') },
    { key: 'audit', label: t('hygieneAudit', '品质巡检') },
    { key: 'device', label: t('hygieneDevice', '设备维护') },
    { key: 'security', label: t('hygieneSecurity', '食安红线') },
    { key: 'protocol', label: t('hygieneProtocol', '标准协议') }
  ];

  // 映射后端字段到前端
  const mapTaskFromApi = (task) => ({
    id: task.id,
    title: task.name,
    desc: task.standard || '',
    deadline: task.frequency || 'daily',
    shift: task.shift || 'morning',
    time: task.time || '',
    status: task.status === 'active' ? '待反馈' : '已禁用',
    category: task.area || 'sop',
    apiTask: task // 保留原始API数据
  });

  // 映射前端字段到后端
  const mapTaskToApi = (task) => ({
    name: task.title,
    area: task.category,
    standard: task.desc,
    frequency: task.deadline || 'daily',
    shift: task.shift || 'morning',
    time: task.time || new Date().toISOString()
  });

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    try {
      const result = await api('GET', '/hygiene/tasks');
      const tasks = Array.isArray(result) ? result : (result?.data || []);
      setSopTasks(tasks.map(mapTaskFromApi));
    } catch (err) {
      console.error('Failed to load tasks:', err);
      showToast(t('loadFailed', '加载失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTask = () => {
    const newTask = {
      id: `temp_${Date.now()}`,
      title: t('newTask', '新任务名称 / New Task Name'),
      desc: t('enterDesc', '请在此输入标准作业描述 / Enter SOP details...'),
      deadline: 'daily',
      shift: 'morning',
      time: new Date().toISOString(),
      status: '待反馈',
      category: activeTab,
      isNew: true
    };
    setSelectedTask(newTask);
    setIsEditing(true);
  };

  const handleUpdateTask = async (id, field, val) => {
    const task = sopTasks.find(t => t.id === id);
    if (!task) return;

    // 先更新本地状态
    const updated = sopTasks.map(t => t.id === id ? { ...t, [field]: val } : t);
    setSopTasks(updated);
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, [field]: val });
    }

    // 如果是已保存的任务，同步到后端
    if (!task.isNew) {
      try {
        const apiData = mapTaskToApi({ ...task, [field]: val });
        await api('PUT', `/hygiene/tasks/${id}`, apiData);
      } catch (err) {
        console.error('Failed to update task:', err);
        showToast(t('saveFailed', '保存失败'));
      }
    }
  };

  const handleSaveTask = async () => {
    if (!selectedTask) return;

    try {
      if (selectedTask.isNew) {
        // 创建新任务
        const apiData = mapTaskToApi(selectedTask);
        const result = await api('POST', '/hygiene/tasks', apiData);
        if (result?.error) {
          showToast(result.error);
          return;
        }
        showToast(t('saveSuccess', '✅ 保存成功'));
      } else {
        // 更新任务
        const apiData = mapTaskToApi(selectedTask);
        await api('PUT', `/hygiene/tasks/${selectedTask.id}`, apiData);
        showToast(t('saveSuccess', '✅ 保存成功'));
      }
      await loadTasks();
      setSelectedTask(null);
    } catch (err) {
      console.error('Failed to save task:', err);
      showToast(t('saveFailed', '保存失败'));
    }
  };

  const handleDeleteTask = async (id) => {
    const task = sopTasks.find(t => t.id === id);
    if (!task) return;

    if (!confirm(t('confirmDelete', '确认删除？'))) return;

    try {
      if (!task.isNew) {
        await api('DELETE', `/hygiene/tasks/${id}`);
      }
      setSopTasks(sopTasks.filter(t => t.id !== id));
      setSelectedTask(null);
      showToast(t('deleteSuccess', '🗑️ 任务已移除'));
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast(t('deleteFailed', '删除失败'));
    }
  };

  const filteredTasks = sopTasks.filter(task => task.category === activeTab);

  return (
    <div className="space-y-8 pb-32 animate-soft text-slate-900 !max-w-full relative">
       {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-10 py-5 rounded-[24px] shadow-3xl font-black text-[14px] animate-soft border-4 border-white">
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
         <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('hygieneHub', '卫生与品质稽核中枢')}</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('staffSubtitle')}</p>
         </div>
         <button 
           onClick={handleAddTask}
           className="h-16 bg-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white transition-all rounded-[24px] px-10 font-black uppercase tracking-widest text-[12px] border border-slate-200 active:scale-95 shadow-sm"
         >
           {t('addHygieneTask', '+ 新增检查项')}
         </button>
      </div>

      <div className="flex flex-wrap gap-4 p-2 bg-slate-100/50 rounded-[40px] border border-slate-100 self-start">
         {categories.map(cat => (
           <button 
             key={cat.key}
             onClick={() => setActiveTab(cat.key)} 
             className={`px-8 py-4 rounded-[28px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === cat.key ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
           >
             {cat.label}
           </button>
         ))}
      </div>

      {loading ? (
        <div className="text-center py-24">
          <p className="text-slate-400 font-black uppercase tracking-widest">{t('loading', '加载中...')}</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredTasks.length > 0 ? filteredTasks.map(task => (
            <div key={task.id} className="card-premium group hover:border-slate-900 transition-all cursor-pointer p-8 flex flex-col justify-between min-h-[280px]" onClick={() => { setSelectedTask(task); setIsEditing(false); }}>
               <div className="space-y-4">
                  <div className="flex justify-between items-start">
                     <span className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-slate-900 group-hover:text-white transition-all text-slate-300">📋</span>
                     <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-3 py-1 rounded-full">{task.deadline}</span>
                  </div>
                  <h4 className="text-[18px] font-black text-slate-900 tracking-tighter">{task.title}</h4>
                  <p className="text-[13px] text-slate-400 font-bold leading-relaxed line-clamp-3">{task.desc}</p>
               </div>
               <div className="pt-6 border-t border-slate-50 flex justify-between items-center mt-6">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">TAP TO EDIT</span>
                  <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-lg flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">✏️</div>
               </div>
            </div>
         )) : (
           <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 rounded-[48px]">
              <p className="text-slate-300 font-black uppercase tracking-[0.3em]">{t('noData', '暂无内容')}</p>
           </div>
         )}
      </div>
      )}

       {selectedTask && (
         <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[250] flex items-center justify-center p-8 animate-soft" onClick={() => setSelectedTask(null)}>
            <div className="bg-white rounded-[64px] shadow-3xl w-full max-w-2xl overflow-hidden animate-soft border-8 border-white p-14 space-y-10" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center bg-slate-50 -m-14 mb-10 p-10">
                  <button onClick={() => setIsEditing(!isEditing)} className={`text-[12px] font-black uppercase tracking-widest px-8 h-12 rounded-full transition-all ${isEditing ? 'bg-orange-500 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
                     {isEditing ? t('previewHygieneTask', '🔍 查看预览') : t('editHygieneTask', '⚙️ 编辑任务')}
                  </button>
                  <div className="flex gap-4">
                     <button onClick={() => handleDeleteTask(selectedTask.id)} className="w-12 h-12 bg-white text-red-400 rounded-full flex items-center justify-center border border-red-50 hover:bg-red-50">🗑️</button>
                     <button onClick={() => setSelectedTask(null)} className="w-12 h-12 bg-white text-slate-300 rounded-full flex items-center justify-center border border-slate-100 hover:text-slate-900">✕</button>
                  </div>
               </div>

               {isEditing ? (
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">TASK TITLE</label>
                        <input 
                           type="text"
                           value={selectedTask.title}
                           onChange={e => handleUpdateTask(selectedTask.id, 'title', e.target.value)}
                           className="w-full bg-slate-50 border-2 border-slate-50 focus:border-slate-900 rounded-[24px] px-6 py-5 text-xl font-black text-slate-900 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">SOP DESCRIPTION</label>
                        <textarea 
                           value={selectedTask.desc}
                           onChange={e => handleUpdateTask(selectedTask.id, 'desc', e.target.value)}
                           className="w-full h-40 bg-slate-50 border-2 border-slate-50 focus:border-slate-900 rounded-[24px] p-6 text-[15px] font-bold text-slate-600 leading-relaxed transition-all outline-none"
                        />
                     </div>
                  </div>
               ) : (
                  <div className="space-y-10">
                     <div className="text-center space-y-4">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedTask.title}</h3>
                        <p className="text-[16px] text-slate-500 font-bold leading-relaxed px-6">{selectedTask.desc}</p>
                     </div>
                     <div className="aspect-video bg-slate-900 rounded-[48px] flex flex-col items-center justify-center text-white space-y-4 border-4 border-white shadow-2xl relative group cursor-pointer" onClick={() => showToast('📷 Camera logic initialized...')}>
                        <span className="text-7xl group-hover:scale-110 transition-all">📷</span>
                        <p className="text-[12px] font-black uppercase tracking-widest opacity-50">CLICK TO SUBMIT PHOTO</p>
                     </div>
                  </div>
               )}

               <div className="flex gap-4 pt-4">
                  <button onClick={handleSaveTask} className="flex-1 h-20 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest text-[14px] shadow-2xl active:scale-95 transition-all">{t('save', '保存')}</button>
                  <button onClick={() => setSelectedTask(null)} className="px-12 h-20 bg-slate-100 text-slate-400 rounded-[32px] font-black uppercase tracking-widest text-[14px]">{t('cancel', '返回')}</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
