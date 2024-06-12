import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { setLocalStorageAuth, useAuthentication } from "hooks/auth";
import { FormEvent, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const { addAlert } = useAlertQueue();

  const navigate = useNavigate();

  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth_api.register(email, username, password);
      setLocalStorageAuth(email);
      navigate("/");
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
      <h1>Register</h1>
      <Form onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <Form.Control
          id="email"
          autoComplete="email"
          className="mb-3"
          type="text"
          placeholder="Email"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          value={email}
          required
        />
        <label htmlFor="username">Username:</label>
        <Form.Control
          id="username"
          autoComplete="username"
          className="mb-3"
          type="text"
          placeholder="Username"
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          value={username}
          required
        />
        Description:
        <Form.Control
          id="password"
          autoComplete="new-password"
          className="mb-3"
          type="password"
          placeholder="Password"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          value={password}
          required
        />
        <Button type="submit">Register</Button>
      </Form>
    </div>
  );
};

export default Register;
