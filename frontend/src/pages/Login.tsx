import { Button } from "components/ui/Button/Button";
import CardWrapper from "components/ui/Card/CardWrapper";
import { Input } from "components/ui/Input/Input";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

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
      {useSpinner ? (
        <Spinner animation="border" />
      ) : (
        <div className="flex justify-center items-center min-h-svh">
          <CardWrapper
            backButtonHref="/signup"
            headerLabel="Welcome Back!"
            showProvider
            backButtonLabel="Not having an account? Create New account"
          >
            <form action="" className="grid grid-cols-1 space-y-6">
              <Input placeholder="Email" />
              <Input placeholder="password" />
              <Button
                // disabled={isPen}
                type="submit"
                className="w-full"
              >
                Login
              </Button>
            </form>
          </CardWrapper>
        </div>
      )}
    </div>
  );
};

export default Login;
