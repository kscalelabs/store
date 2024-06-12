import axios, { AxiosInstance } from "axios";
import { BACKEND_URL } from "constants/backend";
import { createContext, ReactNode, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AUTH_KEY_ID = "AUTH";

const getLocalStorageAuth = (): string | null => {
  return localStorage.getItem(AUTH_KEY_ID);
};

export const setLocalStorageAuth = (email: string) => {
  localStorage.setItem(AUTH_KEY_ID, email);
};

export const deleteLocalStorageAuth = () => {
  localStorage.removeItem(AUTH_KEY_ID);
};

interface AuthenticationContextProps {
  logout: () => void;
  isAuthenticated: boolean;
  email: string | null;
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

  const isAuthenticated = getLocalStorageAuth() !== null;
  const email = getLocalStorageAuth();

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
        email,
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
