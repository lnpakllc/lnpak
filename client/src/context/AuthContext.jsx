import { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.data, // null when signed out
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const value = useMemo(() => {
    const user = data?.user || null;
    const permissions = data?.permissions || [];
    return {
      user,
      permissions,
      loading: isLoading,
      isStaff: !!user && user.role !== 'client',
      isClient: user?.role === 'client',
      can: (...p) => permissions.includes('*') || p.some((x) => permissions.includes(x)),
      async login(email, password, portal) {
        const r = await api.post('/auth/login', { email, password, portal });
        qc.setQueryData(['me'], r.data.data);
        return r.data.data;
      },
      async register(payload) {
        const r = await api.post('/auth/register', payload);
        qc.setQueryData(['me'], r.data.data);
        return r.data.data;
      },
      async logout() {
        await api.post('/auth/logout');
        qc.clear();
        qc.setQueryData(['me'], null);
      },
      refresh: () => qc.invalidateQueries({ queryKey: ['me'] }),
    };
  }, [data, isLoading, qc]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
