// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import { useAuth } from './contexts/AuthContext';
import AppointmentsPage from './pages/doctor/AppointmentsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Dashboard Route - Role-based routing */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <RoleDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Role-specific Dashboard Routes */}
            <Route 
              path="/patient-dashboard" 
              element={
                <ProtectedRoute roles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/doctor-dashboard" 
              element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Management Routes */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />

              <Route 
                path="/doctor/appointments" 
                element={
                  <ProtectedRoute roles={['doctor']}>
                    <AppointmentsPage />
                  </ProtectedRoute>
                } 
              />
            <Route 
              path="/admin/subscriptions" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <SubscriptionManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route 
              path="*" 
              element={
                <div style={{
                  minHeight: '100vh',
                  background: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h1 style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#111827',
                      marginBottom: '1rem'
                    }}>
                      Page Not Found
                    </h1>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                      The page you're looking for doesn't exist.
                    </p>
                    <a 
                      href="/"
                      style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        background: '#4f46e5',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: '500'
                      }}
                    >
                      Go Home
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Role-based dashboard component
const RoleDashboard = () => {
  const { user } = useAuth();
  
  // Route users to their appropriate dashboard based on role
  switch (user?.role) {
    case 'patient':
      return <Navigate to="/patient-dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor-dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    default:
      return <Navigate to="/patient-dashboard" replace />;
  }
};

export default App;