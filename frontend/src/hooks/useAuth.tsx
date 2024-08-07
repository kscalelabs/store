import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { BACKEND_URL } from "constants/backend";
import type { paths } from "gen/api";
import api from "hooks/api";
import createClient, { Client } from "openapi-fetch";

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
  api: api;
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

  const client = createClient<paths>({
    baseUrl: BACKEND_URL,
  });

  // Add the API key to the request headers, if the user is authenticated.
  if (apiKeyId !== null) {
    client.use({
      async onRequest({ request }) {
        request.headers.set("Authorization", `Bearer ${apiKeyId}`);
        return request;
      },
      async onResponse({ response }) {
        return response;
      },
    });
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

  const apiImpl = new api(client);

  return (
    <AuthenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated: apiKeyId !== null,
        apiKeyId,
        client,
        api: apiImpl,
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
