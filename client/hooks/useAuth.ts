
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useMemo } from 'react';

export const useAuth = () => {
  const { isAuthenticated, user, loading, error } = useSelector((state: RootState) => state.user);

  return useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    error,
    role: user?.role,
  }), [isAuthenticated, user, loading, error]);
};
