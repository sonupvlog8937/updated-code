import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserAPI, loginAPI, logoutAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [seller, setSeller]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await getUserAPI();
      const u = res.data.data;
      setUser(u);
      if (u?.sellerProfile) setSeller(u.sellerProfile);
    } catch {
      setUser(null);
      setSeller(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email, password) => {
    const res = await loginAPI({ email, password });
    const { accesstoken, refreshToken } = res.data.data || {};
    if (accesstoken) localStorage.setItem('sellerToken', accesstoken);
    await fetchUser();
    return res.data;
  };

  const logout = async () => {
    try { await logoutAPI(); } catch {}
    localStorage.removeItem('sellerToken');
    setUser(null);
    setSeller(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = () => fetchUser();

  return (
    <AuthContext.Provider value={{ user, seller, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);