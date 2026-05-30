import axios from "axios";

// Use environment variable for API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const useApi = () => {
  return api;
};

export default api;
