import axiosClient from "./axiosClient";

const userApi = {
  getAll: () => axiosClient.get("/Account/users"),
  create: (data) => axiosClient.post("/Account/register", data),
  update: (id, data) => axiosClient.put(`/Account/users/${id}`, data),
  updateRole: (id, role) => axiosClient.put(`/Account/users/${id}/role`, { role }),
  updateStatus: (id, status) => axiosClient.put(`/Account/users/${id}/status`, { status }),
  resetPassword: (id, newPassword) => axiosClient.post(`/Account/users/${id}/reset-password`, { newPassword }),
  delete: (id) => axiosClient.delete(`/Account/users/${id}`)
};

export default userApi;
