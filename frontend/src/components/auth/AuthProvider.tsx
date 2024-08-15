import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";

const GoogleAuthButton = () => {
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

  const handleGoogleLogin = useGoogleLogin({
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
      onClick={() => handleGoogleLogin()}
      disabled={credential !== null}
    >
      <FcGoogle className="w-5 h-5" />
    </Button>
  );
};

const GoogleAuthButtonWrapper = () => {
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    (async () => {
      if (googleClientId !== null) return;

      const { data, error } = await auth.client.GET("/users/google/client-id");
      if (error) {
        addErrorAlert(error);
      } else {
        setGoogleClientId(data.client_id);
      }
    })();
  }, [googleClientId]);

  return googleClientId === null ? (
    <Button
      variant={"outline"}
      size={"lg"}
      className="w-full hover:bg-gray-100 dark:hover:bg-gray-600"
      disabled={true}
    >
      <Spinner />
    </Button>
  ) : (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleAuthButton />
    </GoogleOAuthProvider>
  );
};

const GithubAuthButton = () => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

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

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={handleGithubSubmit}
    >
      <FaGithub className="w-5 h-5" />
    </Button>
  );
};

const AuthProvider = () => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-center items-center mb-4">
        <div className="border-t border-gray-300 flex-grow mr-3"></div>
        <span className="flex-shrink">OR</span>
        <div className="border-t border-gray-300 flex-grow ml-3"></div>
      </div>
      <div className="flex items-center w-full gap-x-2">
        {/* Google */}
        <GoogleAuthButtonWrapper />

        {/* Github */}
        <GithubAuthButton />
      </div>
    </div>
  );
};

export default AuthProvider;
