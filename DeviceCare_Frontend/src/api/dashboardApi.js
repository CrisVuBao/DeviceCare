import axiosClient from "./axiosClient";

const dashboardApi = {
  getSummary: (period = "week") => axiosClient.get(`/Dashboard/summary?period=${period}`)
};

export default dashboardApi;
