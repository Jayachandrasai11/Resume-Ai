import React from 'react';

const WorkflowSettings = () => (
  <div className="space-y-12">
     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Workflow Architecture</h3>
     <div className="space-y-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mandatory Pipeline Stages</p>
        {['Screening', 'Initial Interview', 'Technical Assessment', 'Cultural Alignment', 'Executive Review', 'Hired'].map((stage, idx) => (
          <div key={idx} className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl group">
             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400">{idx + 1}</div>
             <span className="text-xs font-black text-white uppercase tracking-tight flex-1">{stage}</span>
             <button className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-400">Modify</button>
          </div>
        ))}
        <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-indigo-500/30 hover:text-indigo-400 transition-all">+ Inject New Stage</button>
     </div>
  </div>
);

export default WorkflowSettings;
