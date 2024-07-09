import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TCButton from "components/files/TCButton";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { setLocalStorageAuth, useAuthentication } from "hooks/auth";
import { FormEvent, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  const { addAlert } = useAlertQueue();

  const navigate = useNavigate();

  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth_api.login(email, password);
      setLocalStorageAuth(email);
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        addAlert(err.message, "error");
      } else {
        addAlert("Unexpected error when trying to log in", "error");
      }
    }
  };

  const handleGithubSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const redirectUrl = await auth_api.send_register_github();
      window.location.href = redirectUrl;
      // setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        addAlert(err.message, "error");
      } else {
        addAlert("Unexpected error.", "error");
      }
    }
  };

  return (
    <div>
      <h1 className="mb-4">Login</h1>
      <Form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <Form.Control
          id="email"
          autoComplete="username"
          className="mb-3"
          type="text"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          value={email}
          required
        />
        <label htmlFor="password">Password</label>
        <Form.Control
          id="password"
          autoComplete="current-password"
          className="mb-3"
          type="password"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          value={password}
          required
        />
        <div className="mb-4">
          <Link to="/forgot">Forgot your password?</Link>
        </div>
        <TCButton type="submit">Login</TCButton>
      </Form>
      <Form onSubmit={handleGithubSubmit}>
        <div className="mb-3 mt-3 d-flex justify-content-center">OR</div>
        <Button type="submit">
          <FontAwesomeIcon icon={faGithub} style={{ marginRight: 15 }} />
          Login with Github
        </Button>
      </Form>
    </div>
  );
};

export default Login;
