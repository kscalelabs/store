import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const DARK_MODE_KEY = "__DARK_MODE";

const getDarkModeFromLocalStorage = (): boolean => {
  const darkMode = localStorage.getItem(DARK_MODE_KEY);
  if (darkMode === "dark") {
    return true;
  } else if (darkMode === "light") {
    return false;
  } else {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
};

const setThemeWithLocalStorage = (darkMode: boolean) => {
  localStorage.setItem(DARK_MODE_KEY, darkMode ? "dark" : "light");
};

interface DarkModeContextProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextProps | undefined>(
  undefined,
);

interface DarkModeProviderProps {
  children: ReactNode;
}

export const DarkModeProvider = (props: DarkModeProviderProps) => {
  const { children } = props;

  const [darkMode, setDarkMode] = useState<boolean>(
    getDarkModeFromLocalStorage(),
  );

  const setDarkModeWrapper = (darkMode: boolean) => {
    setDarkMode(darkMode);
    setThemeWithLocalStorage(darkMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider
      value={{ darkMode, setDarkMode: setDarkModeWrapper }}
    >
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = (): DarkModeContextProps => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
