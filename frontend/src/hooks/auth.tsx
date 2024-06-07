import axios, { AxiosInstance } from "axios";
import { BACKEND_URL } from "constants/backend";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_KEY_ID = "__API_KEY";

const getLocalStorageApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_ID);
};

const setLocalStorageApiKey = (token: string) => {
  localStorage.setItem(API_KEY_ID, token);
};

const deleteLocalStorageApiKey = () => {
  localStorage.removeItem(API_KEY_ID);
};

interface AuthenticationContextProps {
  apiKey: string | null;
  setApiKey: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  api: AxiosInstance;
}

const AuthenticationContext = createContext<
  AuthenticationContextProps | undefined
>(undefined);

interface AuthenticationProviderProps {
  children: ReactNode;
}

export const AuthenticationProvider = (props: AuthenticationProviderProps) => {
  const { children } = props;

  const [apiKey, setApiKey] = useState<string | null>(getLocalStorageApiKey());

  const navigate = useNavigate();

  const isAuthenticated = apiKey !== null;

  const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
  });

  if (apiKey !== null) {
    // Adds the API key to the request header since it is set.
    api.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${apiKey}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  useEffect(() => {
    if (apiKey === null) {
      deleteLocalStorageApiKey();
    } else {
      setLocalStorageApiKey(apiKey);
    }
  }, [apiKey]);

  const logout = useCallback(() => {
    (async () => {
      try {
        await api.delete<boolean>("/users/logout");
        setApiKey(null);
        navigate("/");
      } catch (error) {
        // Do nothing
      }
    })();
  }, [navigate]);

  return (
    <AuthenticationContext.Provider
      value={{
        apiKey,
        setApiKey,
        logout,
        isAuthenticated,
        api,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = (): AuthenticationContextProps => {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error(
      "useAuthentication must be used within a AuthenticationProvider",
    );
  }
  return context;
};

interface OneTimePasswordWrapperProps {
  children: ReactNode;
}

interface UserLoginResponse {
  api_key: string;
}

export const OneTimePasswordWrapper = ({
  children,
}: OneTimePasswordWrapperProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setApiKey, api } = useAuthentication();

  useEffect(() => {
    (async () => {
      const payload = searchParams.get("otp");
      if (payload !== null) {
        try {
          const response = await api.post<UserLoginResponse>("/users/otp", {
            payload,
          });
          setApiKey(response.data.api_key);
          navigate("/");
        } catch (error) {
          // Do nothing
        } finally {
          searchParams.delete("otp");
        }
      }
    })();
  }, []);

  return <>{children}</>;
};
