import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User } from './types';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import ReferralForm from './pages/ReferralForm';
import ManagementDashboard from './pages/ManagementDashboard';
import ReferralDetails from './pages/ReferralDetails';
import StudentProfile from './pages/StudentProfile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import Layout from './components/Layout';

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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
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
            <Route path="referral/:id" element={<ReferralDetails />} />
            <Route path="student/:id" element={<StudentProfile />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'principal') return <PrincipalDashboard />;
  return <ManagementDashboard />;
};

export default App;
