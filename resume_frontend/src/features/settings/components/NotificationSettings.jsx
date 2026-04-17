import React from 'react';
import Toggle from './Toggle';

const NotificationSettings = ({ notifications, setNotifications }) => (
  <div className="space-y-12">
     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Broadcast Matrix</h3>
     <div className="space-y-8">
        {[
           { id: 'emailAlerts', title: 'Neural Email Direct', desc: 'Receive high-density candidate reports via encrypted mail.' },
           { id: 'browserNotifications', title: 'Tactile Interface Alerts', desc: 'Real-time push notifications on the recruiter taskbar.' },
           { id: 'weeklyReports', title: 'Strategic Analytics Digest', desc: 'Weekly summary of recruitment momentum and talent velocity.' }
        ].map(notif => (
           <div key={notif.id} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 group">
              <div>
                 <p className="text-xs font-black text-white uppercase tracking-[0.2em] group-hover:text-amber-400 transition-colors">{notif.title}</p>
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1.5">{notif.desc}</p>
              </div>
              <Toggle checked={notifications[notif.id]} onChange={(val) => setNotifications({...notifications, [notif.id]: val})} />
           </div>
        ))}
     </div>
  </div>
);

export default NotificationSettings;
