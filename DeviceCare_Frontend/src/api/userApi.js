import axiosClient from './axiosClient';

const userApi = {
  getAll: () => axiosClient.get('/Account/users'),
  updateRole: (id, role) => axiosClient.put(`/Account/users/${id}/role`, { role }),
  updateStatus: (id, status) => axiosClient.put(`/Account/users/${id}/status`, { status }),
  delete: (id) => axiosClient.delete(`/Account/users/${id}`),
};

export default userApi;
