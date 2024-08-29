import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { BACKEND_URL } from "constants/env";
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
  currentUser:
    | paths["/users/public/{id}"]["get"]["responses"][200]["content"]["application/json"]
    | null;
  fetchCurrentUser: () => Promise<void>;
  isLoading: boolean;
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
  const [currentUser, setCurrentUser] = useState<
    | paths["/users/public/{id}"]["get"]["responses"][200]["content"]["application/json"]
    | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  const client = useMemo(
    () =>
      createClient<paths>({
        baseUrl: BACKEND_URL,
      }),
    [apiKeyId],
  );

  // Add the API key to the request headers, if the user is authenticated.
  useEffect(() => {
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
  }, [apiKeyId, client]);

  const fetchCurrentUser = useCallback(async () => {
    if (apiKeyId && !currentUser) {
      setIsLoading(true);
      const { data, error } = await client.GET("/users/public/me");
      if (error) {
        console.error("Failed to fetch current user", error);
      } else {
        setCurrentUser(data);
      }
      setIsLoading(false);
    } else if (!apiKeyId) {
      setIsLoading(false);
    }
  }, [apiKeyId, client, currentUser]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(
    (newApiKeyId: string) => {
      setLocalStorageAuth(newApiKeyId);
      setApiKeyId(newApiKeyId);
      setCurrentUser(null); // Reset current user to trigger a new fetch
      setIsLoading(true);
      navigate("/");
    },
    [navigate],
  );

  const logout = useCallback(() => {
    deleteLocalStorageAuth();
    setApiKeyId(null);
    setCurrentUser(null);
    setIsLoading(false);
    navigate("/");
  }, [navigate]);

  // const apiImpl = new api(client);
  const apiImpl = useMemo(() => new api(client), [client]);

  return (
    <AuthenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated: apiKeyId !== null,
        apiKeyId,
        client,
        api: apiImpl,
        currentUser,
        fetchCurrentUser,
        isLoading,
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
