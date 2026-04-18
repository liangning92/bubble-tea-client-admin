import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

export default function TrainingPage() {
  const { t } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', content: '', category: 'general', difficulty: 'basic',
    duration: 30, passingScore: 60, questions: [], examTitle: ''
  });
  const [questionForm, setQuestionForm] = useState({ question: '', options: ['', '', '', ''], answer: 0, score: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    try {
      const res = await api('GET', '/training/courses');
      setCourses(res?.data || []);
    } catch {}
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setForm({ title: '', content: '', category: 'general', difficulty: 'basic', duration: 30, passingScore: 60, questions: [], examTitle: '' });
    setShowModal(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm({
      title: c.title, content: c.content, category: c.category,
      difficulty: c.difficulty, duration: c.duration, passingScore: c.passingScore,
      questions: [], examTitle: c.exam?.title || ''
    });
    setShowModal(true);
  }

  function addQuestion() {
    if (!questionForm.question.trim()) return;
    setForm(f => ({
      ...f,
      questions: [...f.questions, { ...questionForm }]
    }));
    setQuestionForm({ question: '', options: ['', '', '', ''], answer: 0, score: 10 });
  }

  function removeQuestion(idx) {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (editingId) {
      await api('PUT', `/training/courses/${editingId}`, payload);
    } else {
      await api('POST', '/training/courses', payload);
    }
    setShowModal(false);
    loadCourses();
  }

  async function handleDelete(id) {
    if (!confirm(t('deleteConfirmGeneric') || '确定删除吗？')) return;
    await api('DELETE', `/training/courses/${id}`);
    loadCourses();
  }

  const categories = {
    general: t('catGeneral') || '通用',
    hygiene: t('hygiene') || '卫生',
    ops: t('catOps') || '操作',
    safety: t('safety') || '安全'
  };
  const difficulties = {
    basic: t('levelBasic') || '基础',
    intermediate: t('levelIntermediate') || '进阶',
    advanced: t('levelAdvanced') || '高级'
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-800">📚 {t('trainingManagement') || '培训管理'}</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors">
          + {t('createCourse') || '创建课程'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">{t('loading') || '加载中...'}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl shadow-sm">
          <div className="text-5xl mb-4">📚</div>
          <div>{t('noData') || '暂无培训课程'}</div>
          <button onClick={openAdd} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-bold">{t('createFirstCourse') || '创建第一个课程'}</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-black text-lg text-slate-800">{c.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status === 'active' ? (t('active') || '启用') : (t('archived') || '已归档')}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400 mb-2">
                    <span>{categories[c.category] || c.category}</span>
                    <span>·</span>
                    <span>{difficulties[c.difficulty] || c.difficulty}</span>
                    <span>·</span>
                    <span>{c.duration}{t('minutes') || '分钟'}</span>
                    <span>·</span>
                    <span>{t('passScore') || '及格'}{c.passingScore}{t('scoreUnit') || '分'}</span>
                  </div>
                  <div className="text-sm text-slate-500 line-clamp-2">{c.content?.substring(0, 100)}</div>
                  {c.exam && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        📝 {c.exam.questions ? JSON.parse(c.exam.questions).length : 0} {t('questions') || '题'}
                      </span>
                      <span className="text-xs text-slate-400">{c.exam.title}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEdit(c)} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">{t('edit') || '编辑'}</button>
                  <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">{t('delete') || '删除'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black mb-4">{editingId ? (t('editCourse') || '编辑课程') : (t('createNewCourse') || '创建新课程')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{t('courseTitle') || '课程标题'} *</label>
                <input className="input-premium w-full" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder={t('courseTitlePlaceholder') || '如：卫生清洁操作规范'} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{t('category') || '分类'}</label>
                  <select className="input-premium w-full" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="general">{t('catGeneral') || '通用'}</option>
                    <option value="hygiene">{t('hygiene') || '卫生'}</option>
                    <option value="ops">{t('catOps') || '操作'}</option>
                    <option value="safety">{t('safety') || '安全'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{t('difficulty') || '难度'}</label>
                  <select className="input-premium w-full" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="basic">{t('levelBasic') || '基础'}</option>
                    <option value="intermediate">{t('levelIntermediate') || '进阶'}</option>
                    <option value="advanced">{t('levelAdvanced') || '高级'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{t('duration') || '时长'}({t('minutes') || '分钟'})</label>
                  <input type="number" className="input-premium w-full" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 30 }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{t('trainingContent') || '培训内容'} *</label>
                <textarea className="input-premium w-full h-32 resize-none" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder={t('trainingContentPlaceholder') || '请输入培训内容...'} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{t('passScore') || '及格分数'}</label>
                  <input type="number" className="input-premium w-full" value={form.passingScore} onChange={e => setForm(f => ({ ...f, passingScore: parseInt(e.target.value) || 60 }))} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{t('examTitle') || '考试标题'}</label>
                  <input className="input-premium w-full" value={form.examTitle} onChange={e => setForm(f => ({ ...f, examTitle: e.target.value }))} placeholder={t('examTitlePlaceholder') || '如：卫生规范考试'} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-black text-slate-400 uppercase mb-3">📝 {t('questionEntry') || '试题录入'}</div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <input className="input-premium w-full" value={questionForm.question} onChange={e => setQuestionForm(q => ({ ...q, question: e.target.value }))} placeholder={t('questionContent') || '题目内容'} />
                  <div className="grid grid-cols-2 gap-2">
                    {questionForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${questionForm.answer === i ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                          onClick={() => setQuestionForm(q => ({ ...q, answer: i }))}>{String.fromCharCode(65 + i)}</span>
                        <input className="input-premium flex-1 text-sm" value={opt} onChange={e => {
                          const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm(q => ({ ...q, options: opts }));
                        }} placeholder={`${t('option') || '选项'}${String.fromCharCode(65 + i)}`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{t('score') || '分值'}:</span>
                    <input type="number" className="input-premium w-20 text-sm" value={questionForm.score} onChange={e => setQuestionForm(q => ({ ...q, score: parseInt(e.target.value) || 10 }))} />
                    <button type="button" onClick={addQuestion} className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-bold">+ {t('add') || '添加'}</button>
                  </div>
                </div>
                {form.questions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.questions.map((q, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-slate-200 text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-bold text-orange-600 mr-2">Q{i + 1}.</span>
                            <span>{q.question}</span>
                            <div className="text-xs text-slate-400 mt-1">
                              {t('answer') || '答案'}: {String.fromCharCode(65 + q.answer)} · {q.options[q.answer] || `(${t('notFilled') || '未填写'})`} · {q.score}{t('scoreUnit') || '分'}
                            </div>
                          </div>
                          <button type="button" onClick={() => removeQuestion(i)} className="text-red-500 text-xs font-bold ml-2">{t('delete') || '删除'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600">{t('cancel') || '取消'}</button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-orange-500 text-white">{editingId ? (t('saveChanges') || '保存修改') : (t('createCourse') || '创建课程')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
