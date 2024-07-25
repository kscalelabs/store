import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TCButton from "components/files/TCButton";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { setLocalStorageAuth, useAuthentication } from "hooks/auth";
import { FormEvent, useEffect, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const auth = useAuthentication();
  const { addAlert } = useAlertQueue();
  const navigate = useNavigate();
  const auth_api = new api(auth.api, async (error) => {
    addAlert(humanReadableError(error), "error");
  });

  const [useSpinner, setUseSpinner] = useState(false);

  const handleGithubSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const redirectUrl = await auth_api.sendRegisterGithub();
      // Opens a new window to the Github OAuth page.
      window.open(redirectUrl, "_self");
    } catch (error) {
      addAlert(humanReadableError(error), "error");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Get the code from the query string to carry out OAuth login.
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const code = params.get("code");
        if (auth.isAuthenticated) {
          const { email } = await auth_api.me();
          auth.setEmail(email);
        } else if (code) {
          setUseSpinner(true);
          const res = await auth_api.loginGithub(code as string);
          setLocalStorageAuth(res.api_key_id);
          auth.setIsAuthenticated(true);
          navigate("/");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setUseSpinner(false);
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
