import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.zeedaddy.in',
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor - attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sellerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle 401
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'https://api.zeedaddy.in'}/api/user/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.data?.accessToken;
        if (newToken) {
          localStorage.setItem('sellerToken', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return API(original);
        }
      } catch {
        localStorage.removeItem('sellerToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginAPI        = (data) => API.post('/api/user/login', data);
export const registerAPI     = (data) => API.post('/api/user/register', data);
export const verifyOtpAPI    = (data) => API.post('/api/user/verify-email', data);
export const resendOtpAPI    = (data) => API.post('/api/user/resend-otp', data);
export const logoutAPI       = ()     => API.get('/api/user/logout');
export const getUserAPI      = ()     => API.get('/api/user/user-details');
export const forgotPasswordAPI = (data) => API.post('/api/user/forgot-password', data);
export const resetPasswordAPI  = (data) => API.post('/api/user/reset-password', data);

// ─── Seller ───────────────────────────────────────────────────────────────────
export const registerSellerAPI    = (data) => API.post('/api/seller/register', data);
export const getSellerProfileAPI  = ()     => API.get('/api/seller/profile');
export const updateSellerProfileAPI = (data) => API.put('/api/seller/profile', data);
export const getSellerEarningsAPI = ()     => API.get('/api/seller/earnings');

// ─── Products ─────────────────────────────────────────────────────────────────
export const getSellerProductsAPI  = (params) => API.get('/api/seller/products', { params });
export const createProductAPI      = (data)   => API.post('/api/seller/products/create', data);
export const updateProductAPI      = (id, data) => API.put(`/api/seller/products/${id}`, data);
export const deleteProductAPI      = (id)     => API.delete(`/api/seller/products/${id}`);
export const uploadProductImagesAPI = (formData) => API.post('/api/seller/products/uploadImages', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getSellerOrdersAPI       = (params) => API.get('/api/order/seller/my-orders', { params });
export const updateItemStatusAPI      = (orderId, productId, data) =>
  API.put(`/api/order/seller/item-status/${orderId}/${productId}`, data);

// ─── Payout ───────────────────────────────────────────────────────────────────
export const requestPayoutAPI       = (data)   => API.post('/api/payout/seller/request', data);
export const getPayoutHistoryAPI    = (params) => API.get('/api/payout/seller/history', { params });

// ─── Categories (for product form) ───────────────────────────────────────────
export const getCategoriesAPI = () => API.get('/api/category');

export default API;