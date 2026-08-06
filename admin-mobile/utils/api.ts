import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL ?? 'https://sonuserver-2-r4jc.onrender.com';
  return url.replace(/\/$/, '');
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchDataFromApi = async (url: string): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${getBaseUrl()}${url}`, { headers });
    return response.json();
  } catch {
    return { error: true, message: 'Network error. Please check your connection.' };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postData = async (url: string, data: unknown): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${getBaseUrl()}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const json = await response.json();
    if (!response.ok) return { ...json, status: response.status };
    return json;
  } catch {
    return { error: true, message: 'Network error. Please check your connection.' };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const editData = async (url: string, data: unknown): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${getBaseUrl()}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  } catch {
    return { error: true, message: 'Network error.' };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const patchData = async (url: string, data: unknown): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${getBaseUrl()}${url}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  } catch {
    return { error: true, message: 'Network error.' };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteData = async (url: string): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${getBaseUrl()}${url}`, {
      method: 'DELETE',
      headers,
    });
    return response.json();
  } catch {
    return { error: true, message: 'Network error.' };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadFormData = async (url: string, formData: FormData): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${getBaseUrl()}${url}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: formData,
    });
    return response.json();
  } catch {
    return { error: true, message: 'Upload failed.' };
  }
};
