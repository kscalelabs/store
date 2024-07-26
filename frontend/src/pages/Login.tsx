import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TCButton from "components/files/TCButton";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent, useEffect, useState } from "react";
import { Form, Spinner } from "react-bootstrap";

const Login = () => {
  const auth = useAuthentication();
  const { addAlert } = useAlertQueue();

  const auth_api = new api(
    auth.api,
    async (err) => {
      addAlert(humanReadableError(err), "error");
    },
    () => {
      setUseSpinner(false);
    },
  );

  const [useSpinner, setUseSpinner] = useState(false);

  const handleGithubSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const redirectUrl = await auth_api.sendRegisterGithub();
    window.open(redirectUrl, "_self");
  };

  useEffect(() => {
    (async () => {
      // Get the code from the query string to carry out OAuth login.
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const code = params.get("code");
      if (code) {
        setUseSpinner(true);
        const res = await auth_api.loginGithub(code as string);
        auth.login(res.api_key);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="mb-4">Login</h1>
      {useSpinner ? (
        <Spinner animation="border" />
      ) : (
        <>
          <p>
            If you do not already have an account, authenticating will
            automatically create an account for you.
          </p>
          <Form onSubmit={handleGithubSubmit}>
            <TCButton type="submit">
              <FontAwesomeIcon icon={faGithub} style={{ marginRight: 15 }} />
              Login with Github
            </TCButton>
          </Form>
        </>
      )}
    </div>
  );
};

export default Login;
