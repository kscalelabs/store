import { useRef, useState } from "react";
import { Button, Form, InputGroup, Tooltip } from "react-bootstrap";
import Overlay from "react-bootstrap/Overlay";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Authentication = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const target = useRef(null);

  return (
    <div>
      {authenticated ? (
        <InputGroup>
          <InputGroup.Text>{email}</InputGroup.Text>
          <Button
            variant="outline-secondary"
            onClick={() => setAuthenticated(false)}
          >
            Log Out
          </Button>
        </InputGroup>
      ) : (
        <InputGroup>
          <InputGroup.Text>✉️</InputGroup.Text>
          <Form.Control
            placeholder="Email"
            aria-label="email"
            value={email || ""}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <Button
            variant="outline-secondary"
            onClick={() => setAuthenticated(true)}
            disabled={email === null || !isValidEmail(email)}
            ref={target}
          >
            Log In
          </Button>
          <Overlay
            placement="bottom-end"
            show={email !== null && email.length > 3 && !isValidEmail(email)}
            target={target.current}
          >
            {(props) => <Tooltip {...props}>Invalid email</Tooltip>}
          </Overlay>
        </InputGroup>
      )}
    </div>
  );
};

export default Authentication;
