import { useAuth } from '../context/AuthContext';
import { LandingPage } from './LandingPage';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <>{children}</>;
}
