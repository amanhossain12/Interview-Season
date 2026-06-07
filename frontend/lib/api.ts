import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const authApi = {
  register: (data: RegisterData) => api.post("/auth/register", data),
  login: (data: LoginData) => api.post("/auth/login", data),
  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
};

export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/resumes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAll: () => api.get("/resumes"),
  getById: (id: string) => api.get(`/resumes/${id}`),
  getAnalysis: (id: string) => api.get(`/resumes/${id}/analysis`),
};

export const interviewApi = {
  createSession: (data: CreateSessionData) => api.post("/interviews/sessions", data),
  getSessions: (page = 0, size = 10) =>
    api.get(`/interviews/sessions?page=${page}&size=${size}`),
  getSession: (id: string) => api.get(`/interviews/sessions/${id}`),
  getQuestions: (sessionId: string) =>
    api.get(`/interviews/sessions/${sessionId}/questions`),
  submitAnswer: (sessionId: string, data: SubmitAnswerData) =>
    api.post(`/interviews/sessions/${sessionId}/answers`, data),
  completeSession: (sessionId: string) =>
    api.post(`/interviews/sessions/${sessionId}/complete`),
  getFeedbacks: (sessionId: string) =>
    api.get(`/interviews/sessions/${sessionId}/feedbacks`),
  submitVoiceAnswer: (sessionId: string, audio: Blob, questionId: string) => {
    const formData = new FormData();
    formData.append("audio", audio, "recording.webm");
    formData.append("questionId", questionId);
    return api.post(`/interviews/sessions/${sessionId}/voice-answer`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const codingApi = {
  getChallenges: (params?: { difficulty?: string; category?: string; page?: number }) =>
    api.get("/coding/challenges", { params }),
  getChallenge: (id: string) => api.get(`/coding/challenges/${id}`),
  runCode: (id: string, code: string, language: string, stdin?: string) =>
    api.post(`/coding/challenges/${id}/run`, { code, language, stdin }),
  submitCode: (id: string, code: string, language: string) =>
    api.post(`/coding/challenges/${id}/submit`, { code, language }),
  getSubmissions: (page = 0) => api.get(`/coding/submissions?page=${page}`),
};

export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getProgress: () => api.get("/dashboard/progress"),
};

export const adminApi = {
  getUsers: (page = 0) => api.get(`/admin/users?page=${page}`),
  updateUserStatus: (id: string, active: boolean) =>
    api.put(`/admin/users/${id}/status?active=${active}`),
  getAnalytics: () => api.get("/admin/analytics"),
};

// Types
interface RegisterData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface CreateSessionData {
  targetRole: string;
  experienceLevel: string;
  interviewType: string;
  resumeId?: string;
  questionCategories?: string[];
}

interface SubmitAnswerData {
  questionId: string;
  textContent?: string;
  transcript?: string;
}
