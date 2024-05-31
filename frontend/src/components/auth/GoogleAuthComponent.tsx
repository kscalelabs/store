import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

interface UserLoginResponse {
  token: string;
  token_type: string;
}

const GoogleAuthComponentInner = () => {
  const [credential, setCredential] = useState<string | null>(null);
  const [disableButton, setDisableButton] = useState(false);

  const { setRefreshToken, api } = useAuthentication();
  const { addAlert } = useAlertQueue();

  useEffect(() => {
    (async () => {
      if (credential !== null) {
        try {
          const response = await api.post<UserLoginResponse>("/users/google", {
            token: credential,
          });
          setRefreshToken(response.data.token);
        } catch (error) {
          addAlert(humanReadableError(error), "error");
        } finally {
          setCredential(null);
        }
      }
    })();
  }, [credential, setRefreshToken, api, addAlert]);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const returnedCredential = tokenResponse.access_token;
      if (returnedCredential === undefined) {
        addAlert("Failed to login using Google OAuth.", "error");
      } else {
        setCredential(returnedCredential);
      }
    },
    onError: () => {
      addAlert("Failed to login using Google OAuth.", "error");
      setDisableButton(false);
    },
    onNonOAuthError: () => {
      addAlert("Failed to login using Google OAuth.", "error");
      setDisableButton(false);
    },
  });

  return (
    <Button
      onClick={() => {
        setDisableButton(true);
        login();
      }}
      disabled={disableButton || credential !== null}
    >
      <span style={{ display: "flex", alignItems: "center" }}>
        Sign In with Google
        <FontAwesomeIcon icon={faGoogle} style={{ marginLeft: 15 }} />
      </span>
    </Button>
  );
};

const GoogleAuthComponent = () => {
  // Fatal error if GOOGLE_CLIENT_ID is not set
  if (GOOGLE_CLIENT_ID === undefined) {
    throw new Error(`REACT_APP_GOOGLE_CLIENT_ID is ${GOOGLE_CLIENT_ID}.`);
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleAuthComponentInner />
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthComponent;
