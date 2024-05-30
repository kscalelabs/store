import React, { createContext, ReactNode, useContext, useEffect } from "react";
import darkModes from "../constants/darkModes";
import { useTheme } from "../hooks/theme";
import "../index.css";

interface DarkModeContextProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<
  undefined | { darkMode: string; setDarkMode: Function }
>(undefined);

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, trueSetDarkMode] = React.useState<string>(darkModes.light);
  const { setTheme } = useTheme();

  const getMediaQueryPreference = () => {
    return darkModes.light;
  };

  const storeUserPreference = (choice: string) => {
    localStorage.setItem("darkTheme", choice);
  };

  const getUserPreference = () => {
    return localStorage.getItem("darkTheme");
  };

  const setDarkMode = (choice: string) => {
    trueSetDarkMode(choice);
    storeUserPreference(choice);
    const theme = choice === darkModes.dark ? "dark" : "light";
    setTheme(theme);
  };

  // set the color mode
  useEffect(() => {
    const userPreference = getUserPreference();
    if (userPreference !== null) {
      trueSetDarkMode(userPreference);
    } else {
      trueSetDarkMode(getMediaQueryPreference());
    }
  }, []);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};

export default useDarkMode;
