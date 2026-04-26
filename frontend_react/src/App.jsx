import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage        from './pages/LoginPage';
import AdminDashboard   from './pages/AdminDashboard';
import FarmerDashboard  from './pages/FarmerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import { Toast }        from './components/shared/Toast';
import './styles/global.css';

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/farmer" element={
          <ProtectedRoute role="FARMER"><FarmerDashboard /></ProtectedRoute>
        } />
        <Route path="/customer" element={
          <ProtectedRoute role="CUSTOMER"><CustomerDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
