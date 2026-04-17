import React from 'react';

const RecruitmentSettings = ({ recruitmentPrefs, setRecruitmentPrefs }) => (
  <div className="space-y-8">
     <div>
        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Evaluation Logic</h3>
        <div className="space-y-8">
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <label className="text-[10px] font-black text-white uppercase tracking-widest">Experience Weight</label>
                 <span className="text-indigo-400 font-black text-lg">{recruitmentPrefs.experienceWeight}%</span>
              </div>
              <input 
                 type="range" 
                 min="0" max="100" 
                 value={recruitmentPrefs.experienceWeight} 
                 onChange={(e) => setRecruitmentPrefs({...recruitmentPrefs, experienceWeight: parseInt(e.target.value)})} 
                 className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <label className="text-[10px] font-black text-white uppercase tracking-widest">Skills Weight</label>
                 <span className="text-violet-400 font-black text-lg">{recruitmentPrefs.skillsWeight}%</span>
              </div>
              <input 
                 type="range" 
                 min="0" max="100" 
                 value={recruitmentPrefs.skillsWeight} 
                 onChange={(e) => setRecruitmentPrefs({...recruitmentPrefs, skillsWeight: parseInt(e.target.value)})} 
                 className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-violet-500"
              />
           </div>
        </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
        <div className="space-y-2">
           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Primary Market</label>
           <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none transition-all cursor-pointer">
              <option value="USD">Global Standard ($)</option>
              <option value="EUR">Eurozone (€)</option>
              <option value="INR">Bharat Market (₹)</option>
           </select>
        </div>
        <div className="space-y-2">
           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Target Industry</label>
           <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none transition-all cursor-pointer">
              <option>Deep Tech / AI</option>
              <option>Fintech / Web3</option>
              <option>Enterprise SaaS</option>
           </select>
        </div>
     </div>
  </div>
);

export default RecruitmentSettings;
