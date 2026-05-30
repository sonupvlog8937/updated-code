import { useLoading } from "@/src/context/LoadingContext";
import { useToast } from "@/src/context/ToastContext";

interface ApiConfig {
  showLoadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  showError?: boolean;
  showSuccess?: boolean;
}

export function useApi() {
  const { showLoader, hideLoader } = useLoading();
  const { showToast } = useToast();

  const request = async <T = any>(
    url: string,
    options: RequestInit = {},
    config: ApiConfig = {}
  ): Promise<T> => {
    const {
      showLoadingMessage = "",
      successMessage = "",
      errorMessage = "",
      showError = true,
      showSuccess = !!successMessage,
    } = config;

    if (showLoadingMessage) {
      showLoader(showLoadingMessage);
    }

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        ...options,
      });

      const data = await response.json();

      if (showLoadingMessage) {
        hideLoader();
      }

      if (!response.ok) {
        const errorMsg =
          errorMessage ||
          data?.message ||
          data?.error ||
          "Request failed";

        if (showError) {
          showToast(errorMsg, "error");
        }

        throw new Error(errorMsg);
      }

      if (showSuccess) {
        showToast(successMessage, "success");
      }

      return data;
    } catch (error) {
      if (showLoadingMessage) {
        hideLoader();
      }

      const errorMsg = (error as Error).message;

      if (showError && !errorMessage) {
        showToast(errorMsg, "error");
      }

      throw error;
    }
  };

  const get = async <T = any>(
    url: string,
    config?: ApiConfig
  ): Promise<T> => {
    return request<T>(url, { method: "GET" }, config);
  };

  const post = async <T = any>(
    url: string,
    body?: any,
    config?: ApiConfig
  ): Promise<T> => {
    return request<T>(
      url,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  };

  const put = async <T = any>(
    url: string,
    body?: any,
    config?: ApiConfig
  ): Promise<T> => {
    return request<T>(
      url,
      {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  };

  const patch = async <T = any>(
    url: string,
    body?: any,
    config?: ApiConfig
  ): Promise<T> => {
    return request<T>(
      url,
      {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  };

  const deleteReq = async <T = any>(
    url: string,
    config?: ApiConfig
  ): Promise<T> => {
    return request<T>(url, { method: "DELETE" }, config);
  };

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: deleteReq,
  };
}
