import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import { useAuth } from '../context/AuthContext';

const DashboardSelector = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <Dashboard />;
};

const EntryRoute = () => {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) return null;

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise show Premium Landing page for unauthenticated users
  return <PremiumLanding />;
};

import CandidateList from '../pages/CandidateList';
import CandidateFilters from '../pages/CandidateFilters';
import CandidateDetail from '../pages/CandidateDetail';
import CandidateProfile from '../pages/CandidateProfile';
import CandidateResume from '../pages/CandidateResume';

import UploadResume from '../pages/UploadResume';
import MatchCandidates from '../pages/MatchCandidates';
import MatchResults from '../pages/MatchResults';
import Funnel from '../pages/Funnel';
import ResumeChat from '../pages/ResumeChat';
import InterviewQuestions from '../pages/InterviewQuestions';
import CandidateSearch from '../pages/CandidateSearch';
import Analytics from '../pages/Analytics';
import CandidateExport from '../pages/CandidateExport';
import CandidateStatus from '../pages/CandidateStatus';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Sessions from '../pages/Sessions';
import RecruitmentSetup from '../pages/RecruitmentSetup';
import GmailImport from '../pages/GmailImport';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import UserManagement from '../pages/UserManagement';
import PremiumLanding from '../pages/PremiumLanding';
import NotFound from '../pages/NotFound';
import PrivateRoute from './PrivateRoute';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import Jobs from '../pages/Jobs';
import JobDetails from '../pages/JobDetails';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<EntryRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Auth-only gate for dashboards */}
      <Route element={<PrivateRoute />}>
         <Route path="/dashboard" element={<DashboardSelector />} />

        {/* Admin only dashboard (aliases supported) */}
        <Route element={<RoleGuard allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      {/* Auth + session enforcement for main app */}
      <Route element={<ProtectedRoute />}>
        <Route path="/sessions" element={<Sessions />} />
        
        <Route element={<Layout />}>
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:jobId" element={<JobDetails />} />
          <Route path="/jobs/:jobId/match" element={<MatchCandidates />} />
          <Route path="/jobs/:jobId/results" element={<MatchResults />} />
          <Route path="/jobs/:jobId/funnel" element={<Funnel />} />
          <Route path="/setup" element={<RecruitmentSetup />} />
          <Route path="/candidates" element={<CandidateFilters />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/candidate/:id" element={<CandidateDetail />} />
          <Route path="/candidates/:id/resume" element={<CandidateResume />} />

           <Route path="/upload" element={<UploadResume />} />
           <Route path="/gmail-import" element={<GmailImport />} />
           <Route path="/search" element={<CandidateSearch />} />
           <Route path="/resume-chat" element={<ResumeChat />} />
          <Route path="/interview-questions" element={<InterviewQuestions />} />
          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
          <Route path="/export" element={<CandidateExport />} />
          <Route path="/candidate-status" element={<CandidateStatus />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
