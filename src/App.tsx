import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User } from './types';
import Layout from './components/Layout';
import { MessageLogProvider } from './context/MessageLogContext';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider, useAuth } from './context/AuthContext';

export { useAuth };

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const CounselorDashboard = lazy(() => import('./pages/CounselorDashboard'));
const ReferralForm = lazy(() => import('./pages/ReferralForm'));
const ManagementDashboard = lazy(() => import('./pages/ManagementDashboard'));
const ManagementReferrals = lazy(() => import('./pages/ManagementReferrals'));
const ReferralDetails = lazy(() => import('./pages/ReferralDetails'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const AdminReferrals = lazy(() => import('./pages/AdminReferrals'));
const MessageCenter = lazy(() => import('./pages/MessageCenter'));
const PrincipalDashboard = lazy(() => import('./pages/PrincipalDashboard'));
const BehavioralViolations = lazy(() => import('./pages/BehavioralViolations'));
const PrintTemplate = lazy(() => import('./pages/PrintTemplate'));
const VPRadar = lazy(() => import('./pages/VPRadar'));
const StudentRecordSearch = lazy(() => import('./pages/StudentRecordSearch'));
const TeacherRollCall = lazy(() => import('./pages/TeacherRollCall'));
const DailyAbsenceReport = lazy(() => import('./pages/DailyAbsenceReport'));
const ParentLogin = lazy(() => import('./pages/ParentLogin'));
const ParentPortal = lazy(() => import('./pages/ParentPortal'));
const Register = lazy(() => import('./pages/Register'));



const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (location.pathname === '/parent-portal') {
      return <Navigate to="/parent-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MessageLogProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/parent-login" element={<ParentLogin />} />
            <Route path="/parent-portal" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentPortal />
              </ProtectedRoute>
            } />
            
            <Route path="/print/:templateId/:referralId" element={
              <ProtectedRoute>
                <PrintTemplate />
              </ProtectedRoute>
            } />

            <Route path="/print/daily-absence" element={
              <ProtectedRoute allowedRoles={['vice_principal', 'principal']}>
                <DailyAbsenceReport />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardSwitcher />} />
              <Route path="referral/new" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <ReferralForm />
                </ProtectedRoute>
              } />
              <Route path="referrals" element={
                <ProtectedRoute allowedRoles={['vice_principal', 'counselor', 'principal']}>
                  <ManagementReferrals />
                </ProtectedRoute>
              } />
              <Route path="referral/:id" element={<ReferralDetails />} />
              <Route path="student/:id" element={<StudentProfile />} />
              <Route path="attendance/teacher" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherRollCall />
                </ProtectedRoute>
              } />
              <Route path="attendance/radar" element={
                <ProtectedRoute allowedRoles={['vice_principal', 'principal']}>
                  <VPRadar />
                </ProtectedRoute>
              } />
              <Route path="student-record" element={
                <ProtectedRoute allowedRoles={['vice_principal', 'counselor', 'principal', 'admin']}>
                  <StudentRecordSearch />
                </ProtectedRoute>
              } />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="behavioral-violations" element={
                <ProtectedRoute allowedRoles={['vice_principal', 'admin', 'principal']}>
                  <BehavioralViolations />
                </ProtectedRoute>
              } />
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin-referrals" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReferrals />
                </ProtectedRoute>
              } />
              <Route path="message-center" element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'management', 'vice_principal']}>
                  <MessageCenter />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </MessageLogProvider>
    </AuthProvider>
  );
};

const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'parent') return <Navigate to="/parent-portal" replace />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'counselor') return <CounselorDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'super_admin') return <SuperAdminDashboard />;
  if (user?.role === 'principal') return <PrincipalDashboard />;
  return <ManagementDashboard />;
};

export default App;
