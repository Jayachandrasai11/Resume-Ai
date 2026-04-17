import React from 'react';
import Toggle from './Toggle';

const IntegrationSettings = ({ integrations, setIntegrations }) => (
  <div className="space-y-12">
     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Neural Bridges</h3>
     <div className="space-y-6">
        {[
           { id: 'slack', name: 'Slack Workspace', desc: 'Push real-time candidate matches to internal channels.' },
           { id: 'gmail', name: 'Gmail Intelligence', desc: 'Synchronize talent acquisition directly with your inbox.' },
           { id: 'linkedin', name: 'LinkedIn Pipeline', desc: 'Auto-import profiles from Recruiter Lite accounts.' }
        ].map(bridge => (
           <div key={bridge.id} className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-8">
                 <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                 </div>
                 <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">{bridge.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 px-1">{bridge.desc}</p>
                 </div>
              </div>
              <Toggle checked={integrations[bridge.id]} onChange={(val) => setIntegrations({...integrations, [bridge.id]: val})} />
           </div>
        ))}
     </div>
  </div>
);

export default IntegrationSettings;
