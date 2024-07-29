import Button from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card/Card";
import styles from "./Login.module.css";

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
          <div className={styles.container}>
            <Card className="custom-card">
              <CardHeader>
                <CardTitle>Welcome to KScaleLabs</CardTitle>
                <CardDescription>Login</CardDescription>
              </CardHeader>
              <CardContent className={styles.content}>
                <Input placeholder="Email" type="text" />
                <Input placeholder="Password" type="password" />
              </CardContent>
              <CardFooter>
                <Button>Submit</Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Login;
