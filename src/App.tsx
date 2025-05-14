import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded screens
const Users = lazy(() => import('./screens/users/Users'));
const UserDetail = lazy(() => import('./screens/users/UserDetail'));
const Payments = lazy(() => import('./screens/payments/Payments'));
const PaymentDetail = lazy(() => import('./screens/payments/PaymentDetail'));
const Withdrawals = lazy(() => import('./screens/withdrawals/Withdrawals'));
const WithdrawalDetail = lazy(() => import('./screens/withdrawals/WithdrawalDetail'));
const Notifications = lazy(() => import('./screens/notifications/Notifications'));
const Login = lazy(() => import('./screens/auth/Login'));
const NotFound = lazy(() => import('./screens/NotFound'));
const Dashboard = lazy(() => import('./screens/dashboard/Dashboard'));
const Doacoes = lazy(() => import('./screens/doacoes/Doacoes'));
const AuditLogs = lazy(() => import('./screens/audit/AuditLogs')); // Nova página de logs

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            {/* Redireciona a rota raiz para dashboard */}
            <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="users/:id" element={<ProtectedRoute><UserDetail /></ProtectedRoute>} />
            <Route path="payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="payments/:id" element={<ProtectedRoute><PaymentDetail /></ProtectedRoute>} />
            <Route path="withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
            <Route path="withdrawals/:id" element={<ProtectedRoute><WithdrawalDetail /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="doacoes" element={<ProtectedRoute><Doacoes /></ProtectedRoute>} />
            
            {/* Rota para logs de auditoria (oculta do menu principal) */}
            <Route path="logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;