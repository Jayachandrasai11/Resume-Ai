import React from 'react';

const ProfileSettings = ({ accountInfo, setAccountInfo, activeSessions }) => (
  <div className="space-y-12">
     <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-indigo-500/40 border-4 border-white/10">
           {accountInfo.full_name?.charAt(0) || 'U'}
        </div>
        <div>
           <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Authenticated User</h3>
           <h2 className="text-xl font-black text-white uppercase tracking-tight">{accountInfo.full_name}</h2>
           <p className="text-[11px] font-bold text-slate-500 mt-1">{accountInfo.email}</p>
        </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
        <div className="space-y-2">
           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Display Identity</label>
           <input 
              type="text" 
              value={accountInfo.full_name} 
              onChange={(e) => setAccountInfo({ ...accountInfo, full_name: e.target.value })} 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
              placeholder="Neural Username"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Global Permissions</label>
           <div className="px-5 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black text-indigo-400 tracking-widest uppercase truncate">
              {accountInfo.role} Authority
           </div>
        </div>
     </div>

     <div className="pt-6 space-y-4">
        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Active Sessions</h4>
        <div className="space-y-3">
           {activeSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all">
                 <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${session.current ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`} />
                    <div>
                       <p className="text-[11px] font-black text-white uppercase tracking-tight">{session.device}</p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{session.location || 'Encrypted Location'} • {session.lastActive}</p>
                    </div>
                 </div>
                 {!session.current && <button className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors">Revoke Access</button>}
              </div>
           ))}
        </div>
     </div>
  </div>
);

export default ProfileSettings;
