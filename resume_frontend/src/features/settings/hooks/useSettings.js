import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export function useSettings() {
  const { user, updateUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState('');

  const userFullName =
    user?.display_name ||
    (user?.full_name || user?.first_name || user?.last_name ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : '');
  
  const [accountInfo, setAccountInfo] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    role: user?.role || 'recruiter',
    full_name: userFullName || '',
  });

  const [recruitmentPrefs, setRecruitmentPrefs] = useState({
    autoRanking: true,
    experienceWeight: 40,
    skillsWeight: 60,
    defaultCurrency: 'USD',
    industry: 'Technology'
  });

  const [aiSettings, setAiSettings] = useState({
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 2048,
    extractKeywords: true,
    enableCopilot: true
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    browserNotifications: false,
    weeklyReports: true,
    newCandidateAlert: true
  });

  const [integrations, setIntegrations] = useState({
    slack: false,
    gmail: true,
    linkedin: false
  });

  const [profileVisibility, setProfileVisibility] = useState({
    showEmail: true,
    showPhone: true
  });

  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Chrome on Windows', current: true, lastActive: 'just now', location: 'San Francisco, US' },
    { id: 2, device: 'Mobile Safari', current: false, lastActive: '2 hours ago', location: 'New York, US' }
  ]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await api.getPreferences();
        if (res.data) {
          setRecruitmentPrefs(res.data.recruitment_prefs || recruitmentPrefs);
          setAiSettings(res.data.ai_settings || aiSettings);
          setNotifications(res.data.notifications || notifications);
          setProfileVisibility(res.data.profile_visibility || profileVisibility);
          setActiveSessions(res.data.active_sessions || activeSessions);
          if (res.data.integrations) setIntegrations(res.data.integrations);
        }
      } catch (error) {
        console.warn('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const handleSave = async () => {
    setIsSaving(true); 
    setSaveError(''); 
    setSaveOk('');
    try {
      const parts = accountInfo.full_name.trim().split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';
      
      await api.updateMe({ 
        first_name, 
        last_name,
        profile_visibility: profileVisibility
      });
      updateUser({ ...user, first_name, last_name, full_name: accountInfo.full_name });
      
      await api.updatePreferences({
        recruitment_prefs: recruitmentPrefs, 
        ai_settings: aiSettings, 
        notifications: notifications,
        profile_visibility: profileVisibility,
        integrations: integrations
      });
      setSaveOk('Configuration synchronized globally.');
    } catch (err) {
      setSaveError('Failed to synchronize settings. Check cloud connection.');
    } finally { setIsSaving(false); }
  };

  return {
    activeTab, setActiveTab,
    isSaving, saveError, saveOk,
    accountInfo, setAccountInfo,
    recruitmentPrefs, setRecruitmentPrefs,
    aiSettings, setAiSettings,
    notifications, setNotifications,
    integrations, setIntegrations,
    activeSessions,
    handleSave,
  };
}
