import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import SignupForm from "components/auth/SignupForm";
import { Button } from "components/ui/Button/Button";
import { Card, CardContent, CardHeader } from "components/ui/Card";
import Header from "components/ui/Header";

type GetEmailSignUpTokenResponse =
  paths["/email-signup/get/{id}"]["get"]["responses"][200]["content"]["application/json"];

const Register = () => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const { id } = useParams();
  const [signupToken, setSignupToken] =
    useState<GetEmailSignUpTokenResponse | null>(null);

  useEffect(() => {
    const fetchSignUpToken = async () => {
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
          setSignupToken(data);
        }
      } catch (err) {
        addErrorAlert(err);
      }
    };
    fetchSignUpToken();
  }, [id]);

  return (
    <div className="flex flex-col items-center mt-20">
      <Card className="w-[400px] shadow-md bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg">
        <CardHeader>
          <Header title="Register" />
        </CardHeader>
        {signupToken ? (
          <CardContent>
            <SignupForm signupTokenId={signupToken.id} />
          </CardContent>
        ) : (
          <CardContent>
            <div className="text-center">
              <p className="text-lg mb-8">Invalid Sign Up Link</p>
              <Button
                variant="outline"
                className="w-full text-white bg-blue-600 hover:bg-opacity-70"
                onClick={() => {
                  navigate("/login");
                }}>
                Login / Signup
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Register;
