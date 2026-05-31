import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;

const apiCache = new Map();

const getCacheKey = (url) => `${localStorage.getItem("accessToken") || "guest"}:${url}`;

const getCachedResponse = (url) => {
    const cacheKey = getCacheKey(url);
    const cached = apiCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() > cached.expireAt) {
        apiCache.delete(cacheKey);
        return null;
    }

    return cached.data;
};

const getAuthHeaders = (contentType = 'application/json') => ({
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': contentType,
});

export const postData = async (url, formData) => {
    try {
        
        const response = await fetch(apiUrl + url, {
            method: 'POST',
            headers: getAuthHeaders(),

            body: JSON.stringify(formData)
        });


        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error:', error);
    }

}



export const fetchDataFromApi = async (url, options = {}) => {
    const { useCache = false, ttl = 120000, forceRefresh = false } = options;
    try {
        // ✅ OPTIMIZATION: Auto-enable cache for specific endpoints
        const autoCacheEndpoints = ['/api/category', '/api/homeSlides', '/api/bannerV1', '/api/bannerList2'];
        const shouldCache = useCache || autoCacheEndpoints.some(endpoint => url.includes(endpoint));
        
        if (shouldCache && !forceRefresh) {
            const cachedData = getCachedResponse(url);
            if (cachedData) return cachedData;
        }
        const params = {
            headers: getAuthHeaders(),
        };

        const { data } = await axios.get(apiUrl + url, params)
        if (shouldCache) {
            apiCache.set(getCacheKey(url), {
                data,
                expireAt: Date.now() + ttl,
            });
        }
        return data;
    } catch (error) {
        console.log(error);
        return error;
    }
}

export const getCachedDataFromApi = (url) => getCachedResponse(url);

export const prefetchDataFromApi = (url, options = {}) =>
    fetchDataFromApi(url, { ...options, useCache: true });

export const uploadImage = async (url, updatedData) => {
    const params = {
        headers: getAuthHeaders('multipart/form-data'),
    };

    return axios.put(apiUrl + url, updatedData, params);
}




export const editData = async (url, updatedData) => {
    const params = {
        headers: getAuthHeaders(),
    };

    return axios.put(apiUrl + url, updatedData, params);
   
}
export const deleteData = async (url, data = null) => {
    try {
        const config = {
            headers: getAuthHeaders(),
        };
        
        // Only add data to config if it's provided
        if (data) {
            config.data = data;
        }

        const response = await axios.delete(apiUrl + url, config);
        return { data: response.data };
    } catch (error) {
        console.error('Delete error:', error);
        return { 
            data: { 
                error: true, 
                success: false, 
                message: error.response?.data?.message || error.message 
            } 
        };
    }
}