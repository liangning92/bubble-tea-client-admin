import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function TrainingPage({ hideHeader }) {
  const { t } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/training');
      if (res && !res.error) {
        const results = Array.isArray(res) ? res : (res?.data || []);
        setCourses([
          { id: 'sop', title: t('sopTitle'), category: t('productCategory'), enrolled: 12, completed: results.filter(r => r.title.includes('SOP')).length },
          { id: 'hygiene', title: t('hygieneTitle'), category: t('hygieneCategory'), enrolled: 15, completed: results.filter(r => r.title.includes('Hygiene')).length },
          { id: 'service', title: t('serviceTitle'), category: t('serviceCategory'), enrolled: 8, completed: results.filter(r => r.title.includes('Service')).length },
        ]);
      } else {
        setCourses([]);
      }
    } catch (e) {
      console.error(e);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const generateQuiz = async (course) => {
    setSelectedCourse(course);
    try {
      // Functional Fix: Backend expects 'content', not 'title'
      const res = await api('POST', '/training/generate-exam', { content: course.title });
      if (res && !res.error) {
        setQuiz({
          title: course.title + ' - AI 审计',
          questions: res.questions || [
            { q: '珍珠波霸的储藏温度应保持在多少摄氏度？', a: '65-70C' }
          ]
        });
        window.dispatchEvent(new CustomEvent('app:success', { detail: t('quizSuccess') }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="py-24 text-center text-label-caps animate-pulse tracking-widest">{t('initializingLearning')}</div>;

  return (
    <div className="space-y-12 animate-soft text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-2">
        {!hideHeader ? (
          <div className="space-y-1">
            <h3 className="text-h1 uppercase  tracking-tight">{t('trainingHub')}</h3>
            <p className="text-label-caps !text-slate-400">{t('trainingSubtitle')}</p>
          </div>
        ) : <div className="flex-1" />}
        <button className="btn-premium active !bg-slate-900 !text-white !px-10 !py-4 !scale-100 hover:scale-105 active:scale-95 transition-all border-none font-black text-[13px] uppercase tracking-widest shadow-xl shadow-slate-900/10">
           ➕ {t('uploadCourse')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
           {courses.map(course => (
             <div key={course.id} className="card-premium !p-10 group hover:border-slate-300 transition-all border-slate-50 bg-white !rounded-[40px] shadow-sm hover:shadow-xl">
                <div className="flex justify-between items-start flex-wrap gap-6">
                   <div className="space-y-3">
                      <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[14px] font-black rounded-lg uppercase tracking-widest border border-slate-200">{course.category}</span>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{course.title}</h4>
                   </div>
                    <div className="text-right">
                       <p className="text-label-caps mb-1">{t('completion')}</p>
                       <div className="text-3xl font-black text-slate-900 tracking-tighter">{Math.round((course.completed/course.enrolled)*100)}%</div>
                    </div>
                </div>

                 <div className="mt-10 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 gap-8 group-hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <span className="text-label-caps text-slate-900 border-r border-slate-200 pr-5">{t('enrolledStaff')}</span>
                       <span className="text-2xl font-black text-slate-900">{course.enrolled}</span>
                    </div>
                   <div className="flex gap-4 w-full md:w-auto">
                      <button className="flex-1 md:flex-none px-8 py-3.5 bg-white text-[14px] font-black uppercase tracking-widest border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all shadow-sm active:scale-95">{t('previewContent')}</button>
                      <button onClick={() => generateQuiz(course)} className="flex-1 md:flex-none px-8 py-3.5 bg-slate-900 text-marigold text-[14px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-slate-900/10 active:scale-95">⚡ {t('generateQuiz')}</button>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-10">
           {quiz ? (
              <div className="card-premium border-slate-900/10 bg-slate-50/20 !p-10 space-y-8 animate-soft shadow-2xl !rounded-[48px] relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900 opacity-5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                 <div className="flex justify-between items-center border-b border-slate-100 pb-6 relative z-10">
                    <h4 className="text-xl font-black text-slate-900  tracking-tighter uppercase">{t('quizPreview')}</h4>
                    <button onClick={() => setQuiz(null)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[14px] font-black text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">✕</button>
                 </div>
                 <div className="space-y-6 relative z-10">
                    {quiz.questions.map((q, i) => (
                      <div key={i} className="space-y-3 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                         <p className="text-[14px] font-black text-slate-800 leading-relaxed uppercase tracking-tight">Q{i+1}: {q.q}</p>
                         <p className="text-[14px] text-slate-400 font-black uppercase mt-2 pt-2 border-t border-slate-50 tracking-widest">
                           <span className="text-emerald-500">{t('correctAnswer')}</span> <span className="text-slate-900 font-mono">{q.a}</span>
                         </p>
                      </div>
                    ))}
                 </div>
                 <button className="w-full btn-premium active !bg-slate-900 !text-white border-none mt-4 text-[14px] font-black uppercase tracking-widest !h-16 shadow-2xl shadow-slate-900/20 !rounded-[28px] hover:scale-105 transition-all relative z-10">
                    {t('activateAssessment')}
                 </button>
              </div>
           ) : (
              <div className="card-premium bg-slate-50 border border-slate-100 !p-12 text-center space-y-10 shadow-sm !rounded-[48px] relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 opacity-80"></div>
                 <div className="w-24 h-24 bg-white shadow-sm rounded-[40px] flex items-center justify-center text-4xl mx-auto border border-white relative z-10 group-hover:rotate-12 transition-transform">🤖</div>
                 <div className="space-y-4 relative z-10">
                    <h4 className="text-2xl font-black tracking-tighter  uppercase text-slate-900">{t('aiTrainingHub')}</h4>
                    <p className="text-[13px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">{t('aiTrainingDesc')}</p>
                 </div>
              </div>
           )}

           <div className="p-10 bg-white rounded-[40px] border border-slate-100 shadow-sm flex items-start gap-6 hover:shadow-md transition-shadow">
              <span className="text-3xl mt-1">💡</span>
              <div className="space-y-2">
                 <h5 className="text-[15px] font-black text-slate-900 uppercase tracking-tighter ">{t('certificationTitle')}</h5>
                 <p className="text-[14px] text-slate-400 font-bold leading-relaxed  uppercase tracking-tighter">
                    {t('certificationDesc')}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
