import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent, useState } from "react";
import { Button, Form } from "react-bootstrap";

const Forgot = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  const [email, setEmail] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth_api.forgot(email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Forgot Password</h1>
      {success ? (
        <p>
          If your account exists, an email with a password reset link will be
          sent.
        </p>
      ) : (
        <Form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <Form.Control
            id="email"
            className="mb-3"
            type="text"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            value={email}
            required
          />
          <Button className="mt-2" type="submit">
            Send
          </Button>
        </Form>
      )}
    </div>
  );
};

export default Forgot;
