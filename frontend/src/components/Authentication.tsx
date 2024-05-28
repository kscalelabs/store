import React, { useEffect, useState, useRef } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import Overlay from "react-bootstrap/Overlay";
import { Tooltip } from "react-bootstrap";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Authentication = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const target = useRef(null);

  return (
    <div style={{ maxWidth: 400 }}>
      {authenticated ? (
        <InputGroup className="mb-3">
          <InputGroup.Text>{email}</InputGroup.Text>
          <Button
            variant="outline-secondary"
            onClick={() => setAuthenticated(false)}
          >
            Log Out
          </Button>
        </InputGroup>
      ) : (
        <InputGroup className="mb-3">
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
            placement="right"
            show={email !== null && !isValidEmail(email)}
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
