import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "__THEME";

interface ThemeColors {
  backgroundColor: string;
  color: string;
  buttonBorder: string;
  buttonHover: string;
  text_color: string;
}

const COLORS: { [key in Theme]: ThemeColors } = {
  light: {
    backgroundColor: "#ffffff",
    color: "#201a42",
    buttonBorder: "#0D6EFD",
    buttonHover: "#0D6EFD",
    text_color: "#f5f2ef",
  },
  dark: {
    backgroundColor: "#000000",
    color: "#f5f2ef",
    buttonBorder: "#8AB9FE",
    buttonHover: "#0D6EFD",
    text_color: "#201a42",
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
  children: ReactNode;
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
    document.body.classList.toggle("dark-mode", theme === "dark");
    document.body.classList.toggle("light-mode", theme === "light");
    document.body.style.backgroundColor = COLORS[theme].backgroundColor;
    document.body.style.color = COLORS[theme].color;
  }, [theme, COLORS]);

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
