import { createContext, ReactNode, useContext, useState } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "__THEME";

const getThemeFromLocalStorage = (): Theme => {
  const theme = localStorage.getItem(THEME_KEY);
  if (theme === null) {
    return "dark";
  }
  return theme as Theme;
};

const setThemeWithLocalStorage = (theme: Theme) => {
  localStorage.setItem(THEME_KEY, theme);
};

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children } = props;

  const [theme, setTheme] = useState<Theme>(getThemeFromLocalStorage());

  const setThemeWrapper = (theme: Theme) => {
    setTheme(theme);
    setThemeWithLocalStorage(theme);
  };
  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeWrapper }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
