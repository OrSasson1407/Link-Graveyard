import api from "./api";

// Auth
export const authApi = {
  async register(email: string, password: string) {
    const res = await api.post("/api/v1/auth/register", { email, password });
    return res.data;
  },
  async login(email: string, password: string) {
    const res = await api.post("/api/v1/auth/login", { email, password });
    const { accessToken } = res.data;
    localStorage.setItem("access_token", accessToken);
    return res.data;
  },
  async logout() {
    await api.post("/api/v1/auth/logout");
    localStorage.removeItem("access_token");
    window.location.href = "/";
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  },
};

// Links
export const linksApi = {
  async getAll(params?: {
    status?: string;
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) {
    const res = await api.get("/api/v1/links", { params });
    return res.data;
  },
  async create(url: string, contextText?: string) {
    const res = await api.post("/api/v1/links", {
      url,
      source: "WEB_EXT",
      context_text: contextText || "",
    });
    return res.data;
  },
  async updateStatus(id: string, status: "ACTIVE" | "ARCHIVED" | "FAILED") {
    const res = await api.put(`/api/v1/links/${id}/status`, { status });
    return res.data;
  },
  async softDelete(id: string) {
    const res = await api.delete(`/api/v1/links/${id}`);
    return res.data;
  },
  async reanalyze(id: string) {
    const res = await api.post(`/api/v1/links/${id}/reanalyze`);
    return res.data;
  },
  async whyDidISaveThis(id: string) {
    const res = await api.get(`/api/v1/links/${id}/why-did-i-save-this`);
    return res.data;
  },
};