import axiosClient from "./axiosClient";

const customerApi = {
  getAll: () => axiosClient.get("/Customer"),
  getById: (id) => axiosClient.get(`/Customer/${id}`),
  getRepairs: (id) => axiosClient.get(`/Customer/${id}/repairs`),
  findByPhone: (phone) => axiosClient.get(`/Customer/find/${phone}`),
  create: (data) => axiosClient.post("/Customer", data),
  update: (id, data) => axiosClient.put(`/Customer/${id}`, data),
  delete: (id) => axiosClient.delete(`/Customer/${id}`)
};

export default customerApi;
