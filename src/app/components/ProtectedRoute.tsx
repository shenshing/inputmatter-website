import { Navigate } from 'react-router';
import { useAuth, UserRole } from '../context/AuthContext';

interface Props {
  role: UserRole;
  children: React.ReactNode;
}

export default function ProtectedRoute({ role, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
