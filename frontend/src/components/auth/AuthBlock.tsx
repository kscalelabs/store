import { useEffect, useState } from "react";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import AuthProvider from "components/auth/AuthProvider";
import LoginForm from "components/auth/LoginForm";
import SignupWithEmail from "components/auth/SignupWithEmail";
import BackButton from "components/ui/Button/BackButton";
import { Card, CardContent, CardFooter, CardHeader } from "components/ui/Card";
import Header from "components/ui/Header";
import Spinner from "components/ui/Spinner";

export const AuthBlockInner = () => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [isSignup, setIsSignup] = useState(false);
  const [useSpinner, setUseSpinner] = useState(false);

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
        <Spinner />
      </CardContent>
    );
  }

  return (
    <>
      <CardContent>
        {isSignup ? <SignupWithEmail /> : <LoginForm />}
      </CardContent>
      <CardFooter>
        <AuthProvider />
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

interface AuthBlockProps {
  title?: string;
  onClosed?: () => void;
}

const AuthBlock: React.FC<AuthBlockProps> = ({ title, onClosed }) => {
  return (
    <Card className="w-[400px] shadow-md bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg">
      <CardHeader>
        <Header title={title} onClosed={onClosed} />
      </CardHeader>
      <AuthBlockInner />
    </Card>
  );
};

export default AuthBlock;
