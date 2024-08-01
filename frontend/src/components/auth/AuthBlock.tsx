import BackButton from "components/ui/Button/BackButton";
import { Card, CardContent, CardFooter, CardHeader } from "components/ui/Card";
import Header from "components/ui/Header";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import AuthProvider from "./AuthProvider";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export const AuthBlockInner = () => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [isSignup, setIsSignup] = useState(false);
  const [useSpinner, setUseSpinner] = useState(false);

  const handleGithubSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    const { data, error } = await auth.client.GET("/users/github/login");
    if (error) {
      addErrorAlert(error);
    } else {
      window.open(data, "_self");
    }
  };

  useEffect(() => {
    (async () => {
      // Get the code from the query string to carry out OAuth login.
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const code = params.get("code");

      if (code) {
        setUseSpinner(true);
        const { data, error } = await auth.client.POST("/users/github/code", {
          body: { code },
        });

        if (error) {
          addErrorAlert(error);
          setUseSpinner(false);
        } else {
          auth.login(data.api_key);
          setUseSpinner(false);
        }
      }
    })();
  }, []);

  if (useSpinner) {
    return (
      <CardContent className="flex justify-center">
        <Spinner animation="border" />
      </CardContent>
    );
  }

  return (
    <>
      <CardContent>{isSignup ? <SignupForm /> : <LoginForm />}</CardContent>
      <CardFooter>
        <AuthProvider handleGithubSubmit={handleGithubSubmit} />
      </CardFooter>
      <CardFooter>
        <BackButton
          onClick={() => setIsSignup((s) => !s)}
          label={
            isSignup
              ? "Already have an account? Login here."
              : "Don't have an account? Create a new account."
          }
        />
      </CardFooter>
    </>
  );
};

const AuthBlock = () => {
  return (
    <Card className="w-[400px] shadow-md h-full mb-40">
      <CardHeader>
        <Header />
      </CardHeader>
      <AuthBlockInner />
    </Card>
  );
};

export default AuthBlock;
