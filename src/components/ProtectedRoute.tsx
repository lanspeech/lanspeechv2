import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { Leaf } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that ensures user has an active subscription
 * Redirects to /billing-expired if subscription is expired or missing
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const { isActive } = useSubscription();

  useEffect(() => {
    // Only check after auth loading is complete
    if (!loading && !isActive) {
      navigate('/billing-expired', { replace: true });
    }
  }, [loading, isActive, navigate]);

  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-gray-500">Verifying your subscription...</p>
      </div>
    );
  }

  // Only render children if subscription is active
  if (!isActive) {
    return null;
  }

  return <>{children}</>;
}
