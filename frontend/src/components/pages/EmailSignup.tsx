import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import SignupForm from "@/components/auth/SignupForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

type GetEmailSignUpTokenResponse =
  paths["/auth/email/signup/get/{id}"]["get"]["responses"][200]["content"]["application/json"];

const EmailSignup = () => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const { id } = useTypedParams(ROUTES.SIGNUP.EMAIL);
  const [isLoading, setIsLoading] = useState(true);
  const [signupToken, setSignupToken] =
    useState<GetEmailSignUpTokenResponse | null>(null);

  useEffect(() => {
    const fetchSignUpToken = async () => {
      if (id === undefined) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await auth.client.GET(
          "/auth/email/signup/get/{id}",
          {
            params: {
              path: { id },
            },
          },
        );
        if (error) {
          addErrorAlert(error);
          setSignupToken(null);
        } else {
          setSignupToken(data);
        }
      } catch (err) {
        addErrorAlert(err);
        setSignupToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSignUpToken();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center mt-20">
        <Card className="w-[400px] shadow-md bg-gray-12 text-gray-2 rounded-lg">
          <CardHeader>
            <Header title="Sign Up" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Spinner />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-20">
      <Card className="w-[400px] shadow-md bg-gray-12 text-gray-2 rounded-lg">
        <CardHeader>
          <Header title="Sign Up" />
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
                onClick={() => {
                  navigate(ROUTES.LOGIN.path);
                }}
              >
                Login / Signup
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EmailSignup;
