import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../features/settings/hooks/useSettings';
import ProfileSettings from '../features/settings/components/ProfileSettings';
import RecruitmentSettings from '../features/settings/components/RecruitmentSettings';
import AISettings from '../features/settings/components/AISettings';
import NotificationSettings from '../features/settings/components/NotificationSettings';
import IntegrationSettings from '../features/settings/components/IntegrationSettings';
import WorkflowSettings from '../features/settings/components/WorkflowSettings';

const Settings = () => {
  const {
    activeTab, setActiveTab,
    isSaving, saveError, saveOk,
    accountInfo, setAccountInfo,
    recruitmentPrefs, setRecruitmentPrefs,
    aiSettings, setAiSettings,
    notifications, setNotifications,
    integrations, setIntegrations,
    activeSessions,
    handleSave,
  } = useSettings();

  const tabs = [
    { id: 'profile', name: 'Profile Settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'recruitment', name: 'Recruitment Logic', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'ai', name: 'AI Models', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'integrations', name: 'Integrations', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V4zm-5 8a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2v-1zm10 0a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2v-1z" /></svg> },
    { id: 'notifications', name: 'Alerts', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { id: 'workflow', name: 'Workflow', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M9 13v-3M12 13v-3M15 13v-3" /></svg> }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Settings <span className="text-indigo-500">Workspace</span></h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-3">Personalize your recruitment environment</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Synchronizing...' : 'Commit Changes'}
        </button>
      </div>

      <AnimatePresence>
        {(saveError || saveOk) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-2xl border ${saveError ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} text-xs font-black uppercase tracking-widest text-center`}
          >
            {saveError || saveOk}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-72 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group
                ${activeTab === tab.id 
                  ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-lg' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
            >
              <span className={`transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id ? 'text-indigo-400' : ''}`}>
                {tab.icon}
              </span>
              <span className="font-black text-[11px] uppercase tracking-widest">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 glass-card p-8 border-white/5">
          {activeTab === 'profile' && <ProfileSettings accountInfo={accountInfo} setAccountInfo={setAccountInfo} activeSessions={activeSessions} />}
          {activeTab === 'recruitment' && <RecruitmentSettings recruitmentPrefs={recruitmentPrefs} setRecruitmentPrefs={setRecruitmentPrefs} />}
          {activeTab === 'ai' && <AISettings aiSettings={aiSettings} setAiSettings={setAiSettings} />}
          {activeTab === 'integrations' && <IntegrationSettings integrations={integrations} setIntegrations={setIntegrations} />}
          {activeTab === 'notifications' && <NotificationSettings notifications={notifications} setNotifications={setNotifications} />}
          {activeTab === 'workflow' && <WorkflowSettings />}
        </div>
      </div>
    </div>
  );
};

export default Settings;