import axios from 'axios';
import useAuthStore from '../store/authStore';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  withCredentials: true
});

// Đính kèm mã xác thực vào nếu login
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// tự động đăng xuất khi hết hạn
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
    }

    const message = error.response?.data?.message || error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
