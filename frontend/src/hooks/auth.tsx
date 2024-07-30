import axios, { AxiosInstance } from "axios";
import { BACKEND_URL } from "constants/backend";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const AUTH_KEY_ID = "AUTH";

const getLocalStorageAuth = (): string | null => {
  return localStorage.getItem(AUTH_KEY_ID);
};

// changed from email to id to accommodate oauth logins that don't use email
export const setLocalStorageAuth = (id: string) => {
  localStorage.setItem(AUTH_KEY_ID, id);
};

export const deleteLocalStorageAuth = () => {
  localStorage.removeItem(AUTH_KEY_ID);
};

interface AuthenticationContextProps {
  login: (apiKeyId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  apiKeyId: string | null;
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
  const navigate = useNavigate();
  const [apiKeyId, setApiKeyId] = useState<string | null>(
    getLocalStorageAuth(),
  );

  const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
  });

  if (apiKeyId !== null) {
    // Adds the API key to the request header.
    api.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${apiKeyId}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  const login = useCallback((apiKeyId: string) => {
    (async () => {
      setLocalStorageAuth(apiKeyId);
      setApiKeyId(apiKeyId);
      navigate("/");
    })();
  }, []);

  const logout = useCallback(() => {
    (async () => {
      deleteLocalStorageAuth();
      setApiKeyId(null);
      navigate("/");
    })();
  }, [navigate]);

  const isAuthenticated = apiKeyId !== null;

  return (
    <AuthenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        apiKeyId: apiKeyId,
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
