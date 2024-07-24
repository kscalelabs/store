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
  logout: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  id: string | null;
  api: AxiosInstance;
  email: string | null;
  setEmail: React.Dispatch<React.SetStateAction<string | null>>;
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    getLocalStorageAuth() !== null,
  );
  const [email, setEmail] = useState<string | null>(null);
  const id = getLocalStorageAuth();

  const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
  });

  const logout = useCallback(() => {
    (async () => {
      try {
        await api.delete<boolean>("/users/logout");
        deleteLocalStorageAuth();
        navigate("/");
      } catch (error) {
        // Do nothing
      }
    })();
  }, [navigate]);

  return (
    <AuthenticationContext.Provider
      value={{
        logout,
        isAuthenticated,
        setIsAuthenticated,
        id,
        api,
        email,
        setEmail,
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
