import { useEffect, useState } from "react";

import AuthProvider from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";
import SignupWithEmail from "@/components/auth/SignupWithEmail";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

interface AuthBlockProps {
  title?: string | React.ReactNode;
  onClosed?: () => void;
  signup?: boolean;
}

const AuthBlock: React.FC<AuthBlockProps> = ({ title, onClosed, signup }) => {
  return (
    <Card className="w-[400px] bg-gray-12 text-gray-12 rounded-lg">
      <CardHeader>
        <Header
          title={title ? title : signup ? "Signup" : "Login"}
          onClosed={onClosed}
        />
      </CardHeader>
      <AuthBlockInner initialSignup={signup} />
    </Card>
  );
};

export const AuthBlockInner: React.FC<{ initialSignup?: boolean }> = ({
  initialSignup,
}) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [isSignup, setIsSignup] = useState(initialSignup ?? false);
  const [useSpinner, setUseSpinner] = useState(false);

  useEffect(() => {
    (async () => {
      // Get the code from the query string to carry out OAuth login.
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const code = params.get("code");

      if (code) {
        setUseSpinner(true);
        const { data, error } = await auth.client.POST("/auth/github/code", {
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
        <Button
          onClick={() => setIsSignup((s) => !s)}
          variant="link"
          className="w-full"
        >
          {isSignup
            ? "Already have an account? Login here."
            : "Don't have an account? Create a new account."}
        </Button>
      </CardFooter>
    </>
  );
};

export default AuthBlock;
