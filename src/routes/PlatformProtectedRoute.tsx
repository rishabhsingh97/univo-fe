import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAuth } from '../context/PlatformAuthContext';

export function PlatformProtectedRoute() {
  const { session } = usePlatformAuth();
  if (!session) {
    return <Navigate to="/platform/login" replace />;
  }
  return <Outlet />;
}
