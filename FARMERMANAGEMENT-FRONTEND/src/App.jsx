import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage        from './pages/LoginPage';
import AdminDashboard   from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Layout           from './Components/layout';
import Dashboard        from './Pages/dashboard';
import AddStock         from './Pages/addstock';
import ViewStock        from './Pages/viewstock';
import AIDemand         from './Pages/aidemand';
import WastageRep       from './Pages/wastagerep';
import OrderStatus      from './Pages/orderstatus';
import Profile          from './Pages/profile';
import { Toast }        from './components/shared/Toast';
import './Css/global.css';

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
        <Route path="/farmer/*" element={
          <ProtectedRoute role="FARMER"><Layout /></ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="add-stock" element={<AddStock />} />
          <Route path="view-stock" element={<ViewStock />} />
          <Route path="demand" element={<AIDemand />} />
          <Route path="wastage-report" element={<WastageRep />} />
          <Route path="orders" element={<OrderStatus />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/customer" element={
          <ProtectedRoute role="CUSTOMER"><CustomerDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
