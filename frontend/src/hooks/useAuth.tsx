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

import type { paths } from "@/gen/api";
import api from "@/hooks/api";
import { BACKEND_URL } from "@/lib/constants/env";
import ROUTES from "@/lib/types/routes";
import createClient, { Client } from "openapi-fetch";

const AUTH_KEY_ID = "AUTH";

const getStoredAuth = (): string | null => {
  const localAuth = localStorage.getItem(AUTH_KEY_ID);
  if (localAuth) {
    return localAuth;
  }

  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${AUTH_KEY_ID}=`),
  );
  if (authCookie) {
    return authCookie.split("=")[1];
  }

  return null;
};

export const setStoredAuth = (id: string) => {
  localStorage.setItem(AUTH_KEY_ID, id);

  const cookieValue = `${AUTH_KEY_ID}=${id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  document.cookie = cookieValue;
};

export const deleteStoredAuth = () => {
  localStorage.removeItem(AUTH_KEY_ID);
  document.cookie = `${AUTH_KEY_ID}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
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
  const [apiKeyId, setApiKeyId] = useState<string | null>(getStoredAuth());
  const [currentUser, setCurrentUser] = useState<
    | paths["/users/public/{id}"]["get"]["responses"][200]["content"]["application/json"]
    | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  const client = useMemo(
    () =>
      createClient<paths>({
        baseUrl: BACKEND_URL,
        headers: apiKeyId ? { Authorization: `Bearer ${apiKeyId}` } : {},
      }),
    [apiKeyId],
  );

  const fetchCurrentUser = useCallback(async () => {
    if (apiKeyId) {
      setIsLoading(true);
      const { data, error } = await client.GET("/users/public/me");
      if (error) {
        console.error("Failed to fetch current user", error);
        logout();
      } else {
        setCurrentUser(data);
      }
      setIsLoading(false);
    } else {
      setCurrentUser(null);
      setIsLoading(false);
    }
  }, [apiKeyId, client]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(
    (newApiKeyId: string) => {
      setStoredAuth(newApiKeyId);
      setApiKeyId(newApiKeyId);
      setCurrentUser(null);
      setIsLoading(true);
      navigate(ROUTES.HOME.path);
    },
    [navigate],
  );

  const logout = useCallback(() => {
    deleteStoredAuth();
    setApiKeyId(null);
    setCurrentUser(null);
    setIsLoading(false);
    navigate(ROUTES.HOME.path);
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
