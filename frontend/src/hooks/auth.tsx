import { BACKEND_URL } from "constants/backend";
import type { paths } from "gen/api";
import createClient, { Client, type Middleware } from "openapi-fetch";
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
  client: Client<paths>;
}

const AuthenticationContext = createContext<
  AuthenticationContextProps | undefined
>(undefined);

interface AuthenticationProviderProps {
  children: ReactNode;
}

const client = createClient<paths>({
  baseUrl: BACKEND_URL,
});

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const accessToken = localStorage.getItem(AUTH_KEY_ID);
    if (!accessToken) {
      throw new Error("No access token found");
    }

    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  },
};

client.use(authMiddleware);
export const apiClient = client;

export const AuthenticationProvider = (props: AuthenticationProviderProps) => {
  const { children } = props;
  const navigate = useNavigate();
  const [apiKeyId, setApiKeyId] = useState<string | null>(
    getLocalStorageAuth(),
  );

  // Add the API key to the request headers, if the user is authenticated.
  if (apiKeyId !== null) {
    client.use(authMiddleware);
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

  return (
    <AuthenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated: apiKeyId !== null,
        apiKeyId,
        client,
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
