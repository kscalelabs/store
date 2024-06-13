import { api } from "hooks/api";
import { setLocalStorageAuth, useAuthentication } from "hooks/auth";
import { FormEvent, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

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
      console.error(err);
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
        <Button type="submit">Login</Button>
      </Form>
    </div>
  );
};

export default Login;
