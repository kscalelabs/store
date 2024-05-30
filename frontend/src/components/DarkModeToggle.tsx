import useDarkMode from "components/useDarkMode";
import colorModes from "constants/colorModes";
import { useRef } from "react";
import { Button } from "react-bootstrap";

const DarkModeToggle = () => {
  const { colorMode, setDarkMode } = useDarkMode();
  const target = useRef(null);

  return (
    <div style={{ maxWidth: 400 }}>
      {colorMode === colorModes.dark ? (
        <Button
          variant="outline-secondary"
          onClick={() => setDarkMode(colorModes.light)}
        >
          ☾
        </Button>
      ) : (
        <Button
          variant="outline-secondary"
          onClick={() => setDarkMode(colorModes.dark)}
          ref={target}
        >
          𖤓
        </Button>
      )}
    </div>
  );
};

export default DarkModeToggle;
