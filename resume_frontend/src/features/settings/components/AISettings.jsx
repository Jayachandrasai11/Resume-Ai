import React from 'react';
import Toggle from './Toggle';

const AISettings = ({ aiSettings, setAiSettings }) => (
  <div className="space-y-8">
     <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">AI Models</h3>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button className={`p-5 rounded-2xl border-2 transition-all text-left group ${aiSettings.model === 'gemini-1.5-pro' ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`} onClick={() => setAiSettings({...aiSettings, model: 'gemini-1.5-pro'})}>
           <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 font-bold group-hover:scale-110 transition-transform text-xs">G1</div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Google DeepMind</p>
           <p className="text-base font-black text-white uppercase tracking-tight">Gemini 1.5 Pro</p>
        </button>
        <button className={`p-5 rounded-2xl border-2 transition-all text-left group ${aiSettings.model === 'gpt-4o' ? 'bg-violet-600/10 border-violet-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`} onClick={() => setAiSettings({...aiSettings, model: 'gpt-4o'})}>
           <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 text-violet-400 font-bold group-hover:scale-110 transition-transform text-xs">OAI</div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">OpenAI Alpha</p>
           <p className="text-base font-black text-white uppercase tracking-tight">GPT-4o Omnis</p>
        </button>
     </div>

     <div className="pt-8 border-t border-white/5 flex items-center justify-between">
        <div>
           <p className="text-[11px] font-black text-white uppercase tracking-widest">AI Assistance</p>
           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enable real-time AI assistance during screening</p>
        </div>
        <Toggle checked={aiSettings.enableCopilot} onChange={(val) => setAiSettings({...aiSettings, enableCopilot: val})} />
     </div>
  </div>
);

export default AISettings;
