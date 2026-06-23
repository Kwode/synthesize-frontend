import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "https://synthesize-backend.onrender.com",
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized (401) errors or network issues
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear tokens and redirect
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_email");
      
      // Dispatch custom event to let React App refresh state immediately
      window.dispatchEvent(new Event("auth_unauthorized"));
      
      // Redirect to login safely if not there
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
