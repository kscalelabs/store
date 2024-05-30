import { useRef } from "react";
import { Button } from "react-bootstrap";
import darkModes from "../constants/darkModes";
import useDarkMode from "./useDarkMode";

const DarkModeToggle = () => {
  const { darkMode, setDarkMode } = useDarkMode();
  const target = useRef(null);

  return (
    <div style={{ maxWidth: 400 }}>
      {darkMode === darkModes.dark ? (
        <Button
          variant="outline-secondary"
          onClick={() => setDarkMode(darkModes.light)}
        >
          ☾
        </Button>
      ) : (
        <Button
          variant="outline-secondary"
          onClick={() => setDarkMode(darkModes.dark)}
          ref={target}
        >
          𖤓
        </Button>
      )}
    </div>
  );
};

export default DarkModeToggle;
