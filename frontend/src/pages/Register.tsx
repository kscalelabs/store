import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent, useEffect, useState } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import TCButton from "components/files/TCButton";

const Register = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const { addAlert } = useAlertQueue();
  const { token } = useParams();

  const navigate = useNavigate();

  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [waiting, setWaiting] = useState<boolean>(true);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth_api.register(token || "", username, password);
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        addAlert(err.message, "error");
      } else {
        addAlert("Unexpected error.", "error");
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (!email) {
        try {
          setEmail(await auth_api.get_registration_email(token || ""));
          setWaiting(false);
        } catch (error) {
          setWaiting(false);

          if (error instanceof Error) {
            addAlert(error.message, "error");
          } else {
            addAlert("Unexpected error.", "error");
          }
        }
      }
    })();
  }, []);

  if (waiting) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center mt-5"
      >
        <Row className="w-100">
          <Col className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Register</h1>
      {email ? (
        <>
          <p>You are registering with email {email}.</p>
          <Form onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <Form.Control
              id="username"
              autoComplete="on"
              className="mb-3"
              type="text"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              value={username}
              required
            />
            <label htmlFor="password">Password</label>
            <Form.Control
              id="password"
              autoComplete="new-password"
              className="mb-3"
              type="password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              value={password}
              required
            />
            <TCButton type="submit">Register</TCButton>
          </Form>
        </>
      ) : (
        <p>
          Your registration link is invalid. Try{" "}
          <Link to="/register">sending yourself a new one</Link>.
        </p>
      )}
    </div>
  );
};

export default Register;
