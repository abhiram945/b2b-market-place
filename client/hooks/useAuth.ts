
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useMemo } from 'react';

export const useAuth = () => {
  const { isAuthenticated, user, loading, isRehydrating, error } = useSelector((state: RootState) => state.user);

  return useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    isRehydrating,
    error,
    role: user?.role,
  }), [isAuthenticated, user, loading, isRehydrating, error]);
};
