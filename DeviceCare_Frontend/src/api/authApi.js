import axiosClient from './axiosClient';

const authApi = {
  login: (data) => {
    return axiosClient.post('/account/login', data);
  },
  register: (data) => {
    return axiosClient.post('/account/register', data);
  },
  getProfile: () => {
    return axiosClient.get('/account/profile');
  },
  updateProfile: (data) => {
    return axiosClient.put('/account/profile', data);
  },
  changePassword: (data) => {
    return axiosClient.post('/account/change-password', data);
  },
  logout: () => {
    return axiosClient.post('/account/logout');
  }
};

export default authApi;
