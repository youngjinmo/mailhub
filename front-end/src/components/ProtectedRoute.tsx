import { Navigate } from 'react-router-dom';
import { checkAuth } from '@/lib/api';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!checkAuth()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
