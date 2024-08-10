import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import SignupForm from "components/auth/SignupForm";
import { Button } from "components/ui/Button/Button";

type EmailSignUpResponse =
  paths["/email-signup/get/{id}"]["get"]["responses"][200]["content"]["application/json"];

const Register = () => {
  const { addErrorAlert } = useAlertQueue();
  const { id } = useParams();
  const [signUpToken, setSignUpToken] = useState<EmailSignUpResponse | null>(
    null,
  );
  const auth = useAuthentication();

  useEffect(() => {
    const fetchSignUpToken = async () => {
      console.log(`id in useEffect: ${id}`);
      if (id === undefined) {
        return;
      }

      try {
        const { data, error } = await auth.client.GET(
          "/email-signup/get/{id}",
          {
            params: {
              path: { id },
            },
          },
        );
        if (error) {
          addErrorAlert(error);
        } else {
          setSignUpToken(data);
        }
      } catch (err) {
        addErrorAlert(err);
      }
    };
    fetchSignUpToken();
  }, [id]);

  if (!signUpToken) {
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
