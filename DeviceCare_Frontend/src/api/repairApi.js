import axiosClient from "./axiosClient";

const isValidId = (id) => {
  return id !== undefined && id !== null && id !== "" && id !== "undefined" && !isNaN(Number(id));
};

const repairApi = {
  createRepair: (data) => {
    return axiosClient.post("/Repair", data);
  },

  getAllRepairs: (status = "", search = "") => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    const queryString = params.toString();
    return axiosClient.get(`/Repair${queryString ? `?${queryString}` : ""}`);
  },

  getPagedRepairs: (page = 1, pageSize = 20, status = "", search = "") => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    return axiosClient.get(`/Repair/paged?${params.toString()}`);
  },

  getRepairDetail: (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error("ID phiếu sửa chữa không hợp lệ"));
    }
    return axiosClient.get(`/Repair/${id}`);
  },

  updateRepair: (id, data) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error("ID phiếu sửa chữa không hợp lệ"));
    }
    return axiosClient.put(`/Repair/${id}`, data);
  },

  updateStatus: (id, payload) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error("ID phiếu sửa chữa không hợp lệ"));
    }
    const body = typeof payload === "string" ? { newStatus: payload } : payload;
    return axiosClient.patch(`/Repair/${id}/status`, body);
  },

  checkout: (id, data) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error("ID phiếu sửa chữa không hợp lệ"));
    }
    return axiosClient.post(`/Repair/${id}/checkout`, data);
  },

  deleteRepair: (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error("ID phiếu sửa chữa không hợp lệ"));
    }
    return axiosClient.delete(`/Repair/${id}`);
  },

  addPart: (id, data) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error("ID phiếu sửa chữa không hợp lệ"));
    }
    return axiosClient.post(`/Repair/${id}/parts`, data);
  },

  removePart: (id, partId) => {
    if (!isValidId(id) || !isValidId(partId)) {
      return Promise.reject(new Error("ID phiếu hoặc linh kiện không hợp lệ"));
    }
    return axiosClient.delete(`/Repair/${id}/parts/${partId}`);
  },

  lookupByPhone: (phone) => {
    if (!phone) {
      return Promise.reject(new Error("Số điện thoại không hợp lệ"));
    }
    return axiosClient.get(`/Repair/lookup?phone=${encodeURIComponent(phone)}`);
  }
};

export default repairApi;
