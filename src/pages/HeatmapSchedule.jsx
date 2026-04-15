import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HeatmapSchedule({ staff }) {
  const { lang } = useAuth();
  
  // 模拟假数据：基于一天时段(08:00 - 22:00) 预估客流量 (热力)
  const [trafficForecast] = useState([
    { hour: '08:00', load: 10 }, { hour: '09:00', load: 20 },
    { hour: '10:00', load: 45 }, { hour: '11:00', load: 80 }, { hour: '12:00', load: 120 }, { hour: '13:00', load: 100 },
    { hour: '14:00', load: 60 }, { hour: '15:00', load: 70 }, { hour: '16:00', load: 95 }, { hour: '17:00', load: 140 }, // 晚高峰
    { hour: '18:00', load: 150 }, { hour: '19:00', load: 110 }, { hour: '20:00', load: 60 }, { hour: '21:00', load: 30 },
    { hour: '22:00', load: 10 }
  ]);

  // 获取人员随机工时假数据 (演示排班甘特图)
  const dummySchedules = staff.map((s, i) => {
     // 根据不同的 index 弄不同班次
     const isMorning = i % 2 === 0;
     const startIdx = isMorning ? 0 : 5;
     const endIdx = isMorning ? 8 : 14;
     return {
        staffId: s.id,
        name: s.name,
        role: s.role,
        shifts: Array.from({ length: 15 }).map((_, h) => h >= startIdx && h < endIdx) // true 表示在岗
     };
  });

  // 每个小时在岗人数推演
  const coverageCount = Array.from({ length: 15 }).map((_, hIdx) => {
     return dummySchedules.filter(s => s.shifts[hIdx]).length;
  });

  // 获得红绿报警：如果推演客流量大(>100)但在岗人数少(<3)，则警告红线。
  const getCoverageColor = (hIdx, load) => {
     const covered = coverageCount[hIdx];
     const expected = Math.ceil(load / 30); // 假设每小时30杯是单人极限
     if (covered < expected) return 'bg-red-50 text-red-600 border-red-200'; // 严重缺人
     if (covered === expected) return 'bg-emerald-50 text-emerald-600 border-emerald-200'; // 恰到好处
     return 'bg-amber-50 text-amber-600 border-amber-200'; // 人员冗余 (浪费人工成本)
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-300">
      
      <div className="mb-6 flex justify-between items-end">
         <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              📊 可视化人效压榨日历 (AI Heatmap)
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-2 max-w-2xl">
              系统已根据昨日门店周围商圈引流曲线推演出今日**预估客流**。请拖拽人工排班，使绿色图谱完全对齐高峰期，消除红色（客诉爆单）与黄色（人员冗余闲置）区间。
            </p>
         </div>
      </div>

      <div className="flex gap-4">
         {/* 左侧：员工列表打底 */}
         <div className="w-1/5 pt-16 flex flex-col gap-2">
            {dummySchedules.map(s => (
               <div key={s.staffId} className="h-10 flex items-center justify-end pr-4 border-r-2 border-slate-200 text-sm font-bold text-slate-700">
                  <div className="flex flex-col items-end leading-tight">
                    <span>{s.name}</span>
                    <span className="text-[14px] text-slate-400 font-normal">{s.role}</span>
                  </div>
               </div>
            ))}
         </div>

         {/* 右侧：排班热力横轴 */}
         <div className="flex-1 overflow-x-auto pb-4 no-scrollbar">
            <div className="min-w-[800px]">
               {/* 顶部预测客流热力图 */}
               <div className="flex mb-4 h-12 w-full gap-1 items-end border-b-2 border-slate-200 pb-2">
                  {trafficForecast.map((tf, i) => {
                     // 高度百分比
                     const hPerc = Math.max(10, (tf.load / 150) * 100);
                     return (
                       <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                          {/* 柱状图 */}
                          <div className={`w-full rounded-t-sm transition-all bg-indigo-200 group-hover:bg-indigo-400`} style={{ height: `${hPerc}%` }}></div>
                          <span className="text-[14px] text-slate-400 font-bold mt-1 scale-90 origin-top">{tf.hour.split(':')[0]}点</span>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[14px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-10">
                            预估客流: {tf.load}
                          </div>
                       </div>
                     )
                  })}
               </div>

               {/* 甘特图区间 */}
               <div className="flex flex-col gap-2 w-full">
                  {dummySchedules.map(s => (
                     <div key={s.staffId} className="flex w-full h-10 gap-1 bg-slate-50/50 rounded-lg p-0.5">
                        {s.shifts.map((isActive, colIdx) => (
                           <div key={colIdx} className={`flex-1 rounded-md transition-all cursor-pointer ${isActive ? 'bg-indigo-500 shadow-sm' : 'hover:bg-slate-200 bg-transparent'}`}>
                              {/* 占位，可以拖拽 */}
                           </div>
                        ))}
                     </div>
                  ))}
               </div>

               {/* 底部评测线区 */}
               <div className="flex w-full gap-1 mt-4">
                  {trafficForecast.map((tf, i) => (
                    <div key={i} className={`flex-1 flex justify-center items-center h-8 rounded-lg border font-black text-[14px] ${getCoverageColor(i, tf.load)}`}>
                       {coverageCount[i]}/{Math.ceil(tf.load / 30)} 人
                    </div>
                  ))}
               </div>
               
            </div>
         </div>
      </div>

    </div>
  );
}
