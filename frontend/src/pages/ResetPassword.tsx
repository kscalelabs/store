import TCButton from "components/files/TCButton";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent, useState } from "react";
import { Form } from "react-bootstrap";
import { useParams } from "react-router-dom";

const ResetPassword = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const { token } = useParams();

  const [password, setPassword] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const { addAlert } = useAlertQueue();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (token === undefined) {
      addAlert("No token provided", "error");
      return;
    }
    try {
      await auth_api.reset_password(token, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        addAlert(err.message, "error");
      } else {
        addAlert("Unexpected error resetting password.", "error");
      }
    }
  };

  return (
    <div>
      <h1 className="mb-4">Reset Password</h1>
      {success ? (
        <p>Your password has been reset.</p>
      ) : (
        <Form onSubmit={handleSubmit}>
          <label htmlFor="new-password">New Password</label>
          <Form.Control
            id="new-password"
            autoComplete="new-password"
            className="mb-3"
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            value={password}
            required
          />
          <TCButton className="mt-2" type="submit">
            Send
          </TCButton>
        </Form>
      )}{" "}
    </div>
  );
};

export default ResetPassword;
