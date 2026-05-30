import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

// Use environment variable if available, otherwise fallback to localhost for development
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "";

// Log the API URL in development mode
if (__DEV__) {
  console.log("🌐 API URL:", API_URL);
}

const apiCache = new Map<string, { data: any; expireAt: number }>();

const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("accessToken");
  } catch {
    return null;
  }
};

const getCacheKey = async (url: string) => {
  const token = (await getToken()) || "guest";
  return `${token}:${url}`;
};

const getAuthHeaders = async (
  contentType: string = "application/json",
): Promise<Record<string, string>> => {
  const token = await getToken();
  console.log("🔑 Auth token present:", !!token);
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": contentType,
  };
};

export const postData = async (url: string, formData: any): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(API_URL + url, {
      method: "POST",
      headers,
      body: JSON.stringify(formData),
    });
    return await response.json();
  } catch (error) {
    console.log("postData error:", error);
    return { error: true, message: "Network error" };
  }
};

interface FetchOptions {
  useCache?: boolean;
  ttl?: number;
  forceRefresh?: boolean;
}

export const fetchDataFromApi = async (
  url: string,
  options: FetchOptions = {},
): Promise<any> => {
  const { useCache = false, ttl = 120000, forceRefresh = false } = options;
  try {
    if (useCache && !forceRefresh) {
      const key = await getCacheKey(url);
      const cached = apiCache.get(key);
      if (cached && Date.now() <= cached.expireAt) return cached.data;
    }
    const headers = await getAuthHeaders();
    const { data } = await axios.get(API_URL + url, { headers });
    if (useCache) {
      const key = await getCacheKey(url);
      apiCache.set(key, { data, expireAt: Date.now() + ttl });
    }
    return data;
  } catch (error) {
    const err = error as AxiosError;
    return err.response?.data ?? { error: true, message: "Network error" };
  }
};

export const putData = async (url: string, updatedData: any): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.put(API_URL + url, updatedData, { headers });
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    return err.response?.data ?? { error: true, message: "Network error" };
  }
};

export const editData = async (url: string, updatedData: any): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.put(API_URL + url, updatedData, { headers });
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    return err.response?.data ?? { error: true, message: "Network error" };
  }
};

export const deleteData = async (
  url: string,
  data: any = null,
): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    console.log("🗑️ DELETE Request Details:", {
      url: API_URL + url,
      headers,
      hasAuth: !!headers.Authorization,
    });

    // Create axios config
    const config = { headers };
    
    // Only add data if provided
    if (data) {
      config.data = data;
    }

    const res = await axios.delete(API_URL + url, config);
    
    console.log("✅ DELETE Success:", {
      status: res.status,
      data: res.data,
    });

    return {
      ...res.data,
      error: false,
      success: true,
    };
  } catch (error) {
    const err = error as AxiosError;
    const errorData = err.response?.data as any;

    console.error("❌ DELETE Failed:", {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: errorData,
      message: err.message,
      url: API_URL + url,
    });

    // Return the server error response if available, otherwise a generic error
    return {
      error: true,
      success: false,
      message: errorData?.message || err.message || "Failed to delete item",
      status: err.response?.status,
      data: errorData,
    };
  }
};

export const uploadImage = async (
  url: string,
  formData: FormData,
): Promise<any> => {
  try {
    const headers = await getAuthHeaders("multipart/form-data");
    const res = await axios.put(API_URL + url, formData, { headers });
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    return err.response?.data ?? { error: true, message: "Upload failed" };
  }
};
