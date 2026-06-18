import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000") + "/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );
        const { accessToken } = res.data;
        localStorage.setItem("access_token", accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        // Token refresh failed — clear token but DO NOT redirect (let React handle it)
        localStorage.removeItem("access_token");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
