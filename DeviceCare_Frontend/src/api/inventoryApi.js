import axiosClient from "./axiosClient";
const inventoryApi = {
  getAll: (params) => axiosClient.get("/Inventory", { params }),
  getById: (id) => axiosClient.get(`/Inventory/${id}`),
  create: (data) => axiosClient.post("/Inventory", data),
  update: (id, data) => axiosClient.put(`/Inventory/${id}`, data),
  importStock: (id, data) => axiosClient.post(`/Inventory/${id}/import`, data),
  getTransactions: (id) => axiosClient.get(`/Inventory/${id}/transactions`),
  delete: (id) => axiosClient.delete(`/Inventory/${id}`)
};

export default inventoryApi;
