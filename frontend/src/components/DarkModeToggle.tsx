
import { useRef, useState } from "react";
import { Button, Form, InputGroup, Tooltip } from "react-bootstrap";
import useDarkMode from "./useDarkMode";
import darkModes from "../constants/darkModes";


const DarkModeToggle = () => {

const {darkMode, setDarkMode} = useDarkMode();
const target = useRef(null);

  return (
    <div style={{ maxWidth: 400 }}>
      {darkMode===darkModes.dark ? (
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
