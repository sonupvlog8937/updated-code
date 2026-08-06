import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDataFromApi, postData } from '@/utils/api';

export interface UserData {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  image?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isPending?: boolean;
}

interface AuthContextType {
  isLogin: boolean;
  isLoading: boolean;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const ALLOWED_ROLES = [
  'ADMIN', 'SELLER', 'GROCERY_SELLER', 'RESTAURANT_SELLER', 'FASHION_SELLER',
  'ELECTRONICS_SELLER', 'MEDICAL_SELLER', 'BEAUTY_SELLER', 'HOME_KITCHEN_SELLER',
  'GIFTS_TOYS_SELLER', 'BOOKS_STATIONERY_SELLER', 'JEWELLERY_SELLER',
  'HARDWARE_SELLER', 'AUTOMOBILE_SELLER', 'DELIVERY_RIDER',
];

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (token && storedUser) {
        const parsed: UserData = JSON.parse(storedUser);
        if (ALLOWED_ROLES.includes(parsed.role)) {
          setUserData(parsed);
          setIsLogin(true);
          // Refresh user data in background
          refreshUserData();
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await fetchDataFromApi('/api/user/profile');
      if (res?.error === false && res?.user) {
        setUserData(res.user);
        await AsyncStorage.setItem('userData', JSON.stringify(res.user));
      }
    } catch {
      // Silent refresh - keep cached data
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await postData('/api/user/signin', { email, password });

      if (res?.error === false) {
        const user: UserData = res.user;
        if (!ALLOWED_ROLES.includes(user?.role)) {
          return { success: false, message: 'Access denied. This app is for admins and sellers only.' };
        }
        await AsyncStorage.setItem('accessToken', res.accessToken ?? '');
        if (res.refreshToken) {
          await AsyncStorage.setItem('refreshToken', res.refreshToken);
        }
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        setUserData(user);
        setIsLogin(true);
        return { success: true };
      }

      return { success: false, message: res?.message ?? 'Invalid credentials. Please try again.' };
    } catch {
      return { success: false, message: 'Network error. Please check your connection and API URL.' };
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await fetchDataFromApi(`/api/user/logout?token=${token}`);
    } catch {
      // Continue logout even if API call fails
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
    setUserData(null);
    setIsLogin(false);
  };

  return (
    <AuthContext.Provider value={{ isLogin, isLoading, userData, setUserData, setIsLogin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
