import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";

interface AuthProvider {
  handleGoogleSubmit?: (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => Promise<void>;
  handleGithubSubmit?: (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => Promise<void>;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const GoogleAuthComponentInner = () => {
  const [credential, setCredential] = useState<string | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    (async () => {
      if (credential !== null) {
        const { data, error } = await auth.client.POST("/users/google/login", {
          body: {
            token: credential,
          },
        });
        if (error) {
          addErrorAlert(error);
        } else {
          auth.login(data.api_key);
        }
      }
    })();
  }, [credential]);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const returnedCredential = tokenResponse.access_token;
      if (returnedCredential === undefined) {
        addErrorAlert("Failed to login using Google OAuth.");
      } else {
        setCredential(returnedCredential);
      }
    },
    onError: () => {
      addErrorAlert("Failed to login using Google OAuth.");
    },
    onNonOAuthError: () => {
      addErrorAlert("Failed to login using Google OAuth.");
    },
  });

  return (
    <Button
      variant={"outline"}
      size={"lg"}
      className="w-full hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={() => login()}
    >
      <FcGoogle className="w-5 h-5" />
    </Button>
  );
};

const AuthProvider = ({ handleGithubSubmit }: AuthProvider) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-center items-center mb-4">
        <div className="border-t border-gray-300 flex-grow mr-3"></div>
        <span className="flex-shrink">OR</span>
        <div className="border-t border-gray-300 flex-grow ml-3"></div>
      </div>
      <div className="flex items-center w-full gap-x-2">
        {/* Google */}
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <GoogleAuthComponentInner />
        </GoogleOAuthProvider>

        {/* Github */}
        <Button
          variant="outline"
          size="lg"
          className="w-full hover:bg-gray-100 dark:hover:bg-gray-600"
          onClick={handleGithubSubmit}
        >
          <FaGithub className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default AuthProvider;
