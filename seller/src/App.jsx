import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/Authcontext';
import ProtectedRoute from './components/Protectedroute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/Productform';
import Orders from './pages/Orders';
import Earnings from './pages/Earnings';
import StoreProfile from './pages/Storeprofile';
import { Analytics, Support, Settings } from './pages/Otherpages';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500 },
            success: { iconTheme: { primary: '#4CAF50', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected - Seller Dashboard */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"        element={<Dashboard />} />
            <Route path="products"         element={<Products />} />
            <Route path="products/add"     element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="orders"           element={<Orders />} />
            <Route path="earnings"         element={<Earnings />} />
            <Route path="store"            element={<StoreProfile />} />
            <Route path="analytics"        element={<Analytics />} />
            <Route path="support"          element={<Support />} />
            <Route path="settings"         element={<Settings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}