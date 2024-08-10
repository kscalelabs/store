import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import SignupForm from "components/auth/SignupForm";
import { Button } from "components/ui/Button/Button";

type EmailSignUpResponse =
  paths["/email-signup/get/{token}"]["get"]["responses"][200]["content"]["application/json"];

const Register = () => {
  const { addErrorAlert } = useAlertQueue();
  const { token } = useParams();
  const [emailToken, setEmailToken] = useState<EmailSignUpResponse | null>(
    null,
  );
  const auth = useAuthentication();

  useEffect(() => {
    const fetchListing = async () => {
      if (token === undefined) {
        return;
      }

      try {
        const { data, error } = await auth.client.GET(
          "/email-signup/get/{token}",
          {
            params: {
              path: { token },
            },
          },
        );
        if (error) {
          addErrorAlert(error);
        } else {
          setEmailToken(data);
        }
      } catch (err) {
        addErrorAlert(err);
      }
    };
    fetchListing();
  }, [token]);

  if (!emailToken) {
    return (
      <div>
        <h1>Invalid Sign Up Link</h1>
        <Button
          variant="outline"
          className="w-full text-white bg-blue-600 hover:bg-opacity-70"
        >
          Login / Signup
        </Button>
      </div>
    );
  }
  return (
    <div>
      <SignupForm />
    </div>
  );
};

export default Register;
