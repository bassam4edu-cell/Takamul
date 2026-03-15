import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User } from './types';
import Landing from './pages/Landing';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import ReferralForm from './pages/ReferralForm';
import ManagementDashboard from './pages/ManagementDashboard';
import ManagementReferrals from './pages/ManagementReferrals';
import ReferralDetails from './pages/ReferralDetails';
import StudentProfile from './pages/StudentProfile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import AdminReferrals from './pages/AdminReferrals';
import MessageCenter from './pages/MessageCenter';
import PrincipalDashboard from './pages/PrincipalDashboard';
import BehavioralViolations from './pages/BehavioralViolations';
import PrintTemplate from './pages/PrintTemplate';
import VPRadar from './pages/VPRadar';
import StudentRecordSearch from './pages/StudentRecordSearch';
import TeacherRollCall from './pages/TeacherRollCall';
import DailyAbsenceReport from './pages/DailyAbsenceReport';
import Layout from './components/Layout';
import { MessageLogProvider } from './context/MessageLogContext';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
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
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          
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
      </Router>
      </MessageLogProvider>
    </AuthProvider>
  );
};

const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'counselor') return <CounselorDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'principal') return <PrincipalDashboard />;
  return <ManagementDashboard />;
};

export default App;
