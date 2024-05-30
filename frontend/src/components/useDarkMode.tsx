import React, { createContext, ReactNode, useContext, useEffect } from "react";
import colorModes from "constants/colorModes";
import { useTheme } from "hooks/theme";

interface DarkModeContextProps {
  colorMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<
  undefined | { colorMode: string; setDarkMode: Function }
>(undefined);

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [colorMode, trueSetDarkMode] = React.useState<string>(colorModes.light);
  const { setTheme } = useTheme();

  const getMediaQueryPreference = () => {
    return colorModes.light;
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
    const theme = choice === colorModes.dark ? "dark" : "light";
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
    <DarkModeContext.Provider value={{ colorMode, setDarkMode }}>
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
