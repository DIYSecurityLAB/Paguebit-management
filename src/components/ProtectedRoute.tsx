import { Navigate } from "react-router-dom";
 
import { useUserContext } from "../context/user.context";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useUserContext();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}