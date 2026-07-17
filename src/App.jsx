import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initStore } from './utils/store';
import { canAccess } from './utils/roles';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import RecruitmentDashboard from './pages/recruitment/RecruitmentDashboard';
import JobOpenings from './pages/hr/JobOpenings';
import Candidates from './pages/recruitment/Candidates';
import ResumeInfo from './pages/recruitment/ResumeInfo';
import AddCandidate from './pages/recruitment/AddCandidate';
import CandidateProfile from './pages/recruitment/CandidateProfile';
import ScheduleInterview from './pages/recruitment/ScheduleInterview';
import InterviewCalendar from './pages/recruitment/InterviewCalendar';
import InterviewSchedule from './pages/recruitment/InterviewSchedule';
import InterviewFeedback from './pages/recruitment/InterviewFeedback';
import RecruitmentPipeline from './pages/recruitment/RecruitmentPipeline';
import Approvals from './pages/recruitment/Approvals';
import Reports from './pages/recruitment/Reports';
import RolesPermissions from './pages/recruitment/RolesPermissions';
import TelephonyInterview from './pages/recruitment/TelephonyInterview';

initStore();

function ProtectedRoute({ children, module }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (module && !canAccess(user.role, module)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<RecruitmentDashboard />} />
        <Route path="job-openings" element={<ProtectedRoute module="jobOpenings"><JobOpenings /></ProtectedRoute>} />
        <Route path="candidates" element={<ProtectedRoute module="candidates"><Candidates /></ProtectedRoute>} />
        <Route path="candidates/add" element={<ProtectedRoute module="candidates"><AddCandidate /></ProtectedRoute>} />
        <Route path="candidates/:id" element={<ProtectedRoute module="candidates"><CandidateProfile /></ProtectedRoute>} />
        <Route path="candidates/:id/edit" element={<ProtectedRoute module="candidates"><AddCandidate /></ProtectedRoute>} />
        <Route path="candidates/:id/schedule" element={<ProtectedRoute module="interviewSchedule"><ScheduleInterview /></ProtectedRoute>} />
        <Route path="interview-calendar" element={<ProtectedRoute module="interviewCalendar"><InterviewCalendar /></ProtectedRoute>} />
        <Route path="interview-schedule" element={<ProtectedRoute module="interviewSchedule"><InterviewSchedule /></ProtectedRoute>} />
        <Route path="interview-feedback/:ivId" element={<ProtectedRoute module="interviewSchedule"><InterviewFeedback /></ProtectedRoute>} />
        <Route path="approvals" element={<ProtectedRoute module="approvals"><Approvals /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
        <Route path="pipeline" element={<ProtectedRoute module="pipeline"><RecruitmentPipeline /></ProtectedRoute>} />
        <Route path="roles-permissions" element={<ProtectedRoute module="rolesPermissions"><RolesPermissions /></ProtectedRoute>} />
          <Route path="resume-info" element={<ProtectedRoute module="resumeInfo"><ResumeInfo /></ProtectedRoute>} />
          <Route path="telephony-interview" element={<ProtectedRoute module="telephonyInterview"><TelephonyInterview /></ProtectedRoute>} />
      </Route>

      <Route path="/recruitment" element={<Navigate to="/dashboard" replace />} />
      <Route path="/recruitment/candidates" element={<Navigate to="/candidates" replace />} />
      <Route path="/recruitment/calendar" element={<Navigate to="/interview-calendar" replace />} />
      <Route path="/recruitment/schedule" element={<Navigate to="/interview-schedule" replace />} />
      <Route path="/recruitment/pipeline" element={<Navigate to="/pipeline" replace />} />
      <Route path="/job-opening" element={<Navigate to="/job-openings" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
