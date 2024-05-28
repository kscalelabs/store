import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "__THEME";

interface ThemeColors {
  backgroundColor: string;
  color: string;
}

const COLORS: { [key in Theme]: ThemeColors } = {
  light: {
    backgroundColor: "#f5f2ef",
    color: "#201a42",
  },
  dark: {
    backgroundColor: "#201a42",
    color: "#f5f2ef",
  },
};

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
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children } = props;

  const [theme, setTheme] = useState<Theme>(getThemeFromLocalStorage());

  const setThemeWrapper = (theme: Theme) => {
    setTheme(theme);
    setThemeWithLocalStorage(theme);
  };

  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
    document.body.style.backgroundColor = COLORS[theme].backgroundColor;
    document.body.style.color = COLORS[theme].color;
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: setThemeWrapper, colors: COLORS[theme] }}
    >
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
