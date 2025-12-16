
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import { db } from './services/mockDb';
import { LandingView } from './views/Landing';
import { LoginView } from './views/Login';
import { OnboardingView } from './views/Onboarding';
import { SuperAdminDashboard } from './views/SuperAdmin';
import { CompanyAdminDashboard } from './views/CompanyAdmin';
import { SupervisorDashboard } from './views/Supervisor';
import { AlmaceneroDashboard } from './views/Almacenero';
import { EmployeeDashboard } from './views/Employee';
import { Layout } from './components/Layout';

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (email: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('zelcon_current_user_id');
    if (storedUserId) {
      const allUsers = db.users.getAll();
      const found = allUsers.find(u => u.id === storedUserId);
      if (found) setUser(found);
    }
    setLoading(false);
  }, []);

  const login = (email: string) => {
    const found = db.users.getByEmail(email);
    if (found) {
      setUser(found);
      localStorage.setItem('zelcon_current_user_id', found.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('zelcon_current_user_id');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-bold tracking-widest">CARGANDO ZELCON...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== UserRole.SUPER_ADMIN && !user.profileCompleted && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-10 text-center text-red-600">Acceso Denegado: No tienes permisos para ver esta página.</div>;
  }

  return <>{children}</>;
};

// Redirect Logic based on Role
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  if (user.role !== UserRole.SUPER_ADMIN && !user.profileCompleted) {
      return <Navigate to="/onboarding" />;
  }

  switch (user.role) {
    case UserRole.SUPER_ADMIN: return <Navigate to="/superadmin/dashboard" />;
    case UserRole.COMPANY_ADMIN: return <Navigate to="/company/dashboard" />;
    case UserRole.SUPERVISOR: return <Navigate to="/supervisor/dashboard" />;
    case UserRole.ALMACENERO: return <Navigate to="/almacenero/dashboard" />;
    case UserRole.TRABAJADOR: return <Navigate to="/employee/dashboard" />;
    default: return <Navigate to="/login" />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingView />} />
          <Route path="/login" element={<LoginView />} />
          
          <Route path="/redirect" element={<RoleRedirect />} />

          <Route path="/onboarding" element={
              <ProtectedRoute allowedRoles={[UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.ALMACENERO, UserRole.TRABAJADOR]}>
                  <OnboardingView />
              </ProtectedRoute>
          } />

          {/* Super Admin */}
          <Route path="/superadmin/*" element={
            <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Company Admin */}
          <Route path="/company/*" element={
            <ProtectedRoute allowedRoles={[UserRole.COMPANY_ADMIN]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<CompanyAdminDashboard />} />
                  <Route path="users" element={<CompanyAdminDashboard />} />
                  <Route path="sst" element={<CompanyAdminDashboard />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Supervisor */}
          <Route path="/supervisor/*" element={
            <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<SupervisorDashboard />} />
                  <Route path="incidents" element={<SupervisorDashboard />} />
                  <Route path="sst" element={<SupervisorDashboard />} />
                  <Route path="training" element={<SupervisorDashboard />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

           {/* Almacenero */}
           <Route path="/almacenero/*" element={
            <ProtectedRoute allowedRoles={[UserRole.ALMACENERO]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<AlmaceneroDashboard />} />
                  <Route path="inventory" element={<AlmaceneroDashboard />} />
                  <Route path="requests" element={<AlmaceneroDashboard />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Employee */}
          <Route path="/employee/*" element={
            <ProtectedRoute allowedRoles={[UserRole.TRABAJADOR]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="sst" element={<EmployeeDashboard />} />
                  <Route path="training" element={<EmployeeDashboard />} />
                  <Route path="warehouse" element={<EmployeeDashboard />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
