import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TCButton from "components/files/TCButton";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent } from "react";
import { Form } from "react-bootstrap";

const Login = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  const { addAlert } = useAlertQueue();

  const handleGithubSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const redirectUrl = await auth_api.send_register_github();
      window.location.href = redirectUrl;
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
      <p>
        If you do not already have an account, authenticating will automatically
        create an account for you.
      </p>
      <Form onSubmit={handleGithubSubmit}>
        <TCButton type="submit">
          <FontAwesomeIcon icon={faGithub} style={{ marginRight: 15 }} />
          Login with Github
        </TCButton>
      </Form>
    </div>
  );
};

export default Login;
