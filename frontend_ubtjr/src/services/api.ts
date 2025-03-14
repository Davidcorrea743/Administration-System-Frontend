import axios from "axios";

const api = axios.create({
  baseURL:
    //import.meta.env.VITE_API_BASE_URL ||
    "https://4b18-185-203-218-47.ngrok-free.app/api/v1", // Asegúrate de que no haya duplicados
  headers: {
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_API_KEY || "j6Ttx62XsfrD+fUyavtZpN+",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
