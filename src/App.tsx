import { Suspense, lazy, useState, useEffect, ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import { UserProvider } from "../src/provider/user.provider";
import { useUserContext } from "./context/user.context"; 

// Lazy-loaded screens
const Users = lazy(() => import('./screens/users/Users'));
const UserDetail = lazy(() => import('./screens/users/userdetails/UserDetail'));
const Payments = lazy(() => import('./screens/payments/Payments'));
const PaymentDetail = lazy(() => import('./screens/payments/PaymentDetail'));
const Withdrawals = lazy(() => import('./screens/withdrawals/Withdrawals'));
const WithdrawalDetail = lazy(() => import('./screens/withdrawals/WithdrawalDetail'));
const Notifications = lazy(() => import('./screens/notifications/Notifications'));
const Login = lazy(() => import('./screens/auth/Login'));
const NotFound = lazy(() => import('./screens/NotFound'));
const Dashboard = lazy(() => import('./screens/dashboard/Dashboard'));
const AuditLogs = lazy(() => import('./screens/audit/AuditLogs'));

const TOKEN_EXPIRY_MARGIN = 60 * 1000; // 1 minuto de margem

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, refreshToken } = useUserContext();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("ACCESS_TOKEN");
    const tokenExpiresAt = localStorage.getItem("TOKEN_EXPIRES_AT");

    if (!accessToken || !tokenExpiresAt) return;

    const expiresAt = new Date(tokenExpiresAt).getTime();
    const now = Date.now();

    if (expiresAt - now < TOKEN_EXPIRY_MARGIN && !refreshing) {
      setRefreshing(true);
      refreshToken().finally(() => setRefreshing(false));
    }
  }, [refreshToken, refreshing]);

  // Não retorna Loader, apenas protege a rota
  if (!user && !isLoading) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <UserProvider>
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
            {/* Rota para logs de auditoria (oculta do menu principal) */}
            <Route path="logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </UserProvider>
  );
}

export default App;