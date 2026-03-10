import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUserAPI, loginAPI, logoutAPI, getCategoriesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [seller, setSeller]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [catData, setCatData] = useState([]);
  const fetchedOnce = useRef(false);

  // alertBox — same API as admin's context.alertBox
  const alertBox = (type, message) => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast(message);
  };

  // Load categories once on mount
  useEffect(() => {
    getCategoriesAPI()
      .then((res) => {
        const cats = res.data?.data || res.data?.categories || res.data || [];
        setCatData(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {});
  }, []);

  const fetchUser = useCallback(async () => {
    // No token? Don't even bother calling the API
    const token = localStorage.getItem('sellerToken');
    if (!token) {
      setUser(null);
      setSeller(null);
      setLoading(false);
      return;
    }
    try {
      const res = await getUserAPI();
      const u = res.data.data;
      setUser(u ?? null);
      setSeller(u?.sellerProfile ?? null);
    } catch (err) {
      // 401 means token is dead — clear everything, no retry
      if (err?.response?.status === 401) {
        localStorage.removeItem('sellerToken');
      }
      setUser(null);
      setSeller(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run only once on mount
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await loginAPI({ email, password });
    const { accesstoken } = res.data.data || {};
    if (accesstoken) localStorage.setItem('sellerToken', accesstoken);

    // Fetch user after login
    await fetchUser();

    // Check role
    const u = res.data.data;
    const role = u?.role;
    if (role && role !== 'SELLER' && role !== 'ADMIN') {
      localStorage.removeItem('sellerToken');
      setUser(null);
      setSeller(null);
      throw new Error('Seller access required. Please register as a seller first.');
    }

    return res.data;
  };

  const logout = async () => {
    try { await logoutAPI(); } catch {}
    localStorage.removeItem('sellerToken');
    setUser(null);
    setSeller(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = useCallback(() => {
    fetchedOnce.current = false; // allow re-fetch
    return fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, seller, loading, login, logout, refreshUser, catData, alertBox }}>
      {children}
    </AuthContext.Provider>
  );
}