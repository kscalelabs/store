import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useRef, useState } from "react";
import { CheckCircle } from "react-bootstrap-icons";
import {
  Button,
  Col,
  Form,
  InputGroup,
  Overlay,
  Row,
  Tooltip,
} from "react-bootstrap";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const EmailAuthComponent = () => {
  const [email, setEmail] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { api } = useAuthentication();
  const { addAlert } = useAlertQueue();

  const target = useRef(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsDisabled(true);
    const login_url = window.location.href;

    try {
      await api.post<boolean>("/users/login", {
        email,
        login_url,
        // 7 days
        lifetime: 60 * 60 * 24 * 7,
      });
      setIsSuccess(true);
    } catch (error) {
      addAlert(humanReadableError(error), "error");
    } finally {
      setIsDisabled(false);
    }
  };

  return isSuccess ? (
    <Row>
      <Col>
        <Row>
          <Col style={{display: 'flex', alignItems: 'left'}}>
            <CheckCircle size={28} color = "green"/>
            <h3 style={{marginLeft: '10px', marginBottom: '0px'}}>Verification Email Sent!</h3>
          </Col>
        </Row>
        <Row className = "mb-3" style={{alignItems:'center'}}>
          <Col style={{alignItems:'center'}}>Check your email for a login link.</Col>
        </Row>
      </Col>
    </Row>
  ) : (
    <Form onSubmit={handleSubmit} className="mb-3">
      <InputGroup>
        <Form.Control
          type="email"
          placeholder="name@example.com"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          value={email}
          disabled={isDisabled}
        />
        <Button
          variant="primary"
          type="submit"
          disabled={isDisabled || email.length === 0 || !isValidEmail(email)}
          ref={target}
        >
          Sign In
          <FontAwesomeIcon icon={faEnvelope} style={{ marginLeft: 15 }} />
        </Button>
        <Overlay
          placement="bottom-end"
          show={email !== null && email.length > 3 && !isValidEmail(email)}
          target={target.current}
        >
          {(props) => <Tooltip {...props}>Invalid email</Tooltip>}
        </Overlay>
      </InputGroup>
    </Form>
  );
};

export default EmailAuthComponent;
