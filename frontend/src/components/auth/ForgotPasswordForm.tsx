import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import PasswordInput from "@/components/ui/Input/PasswordInput";
import { Button } from "@/components/ui/button";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ResetPasswordSchema, ResetPasswordType } from "@/lib/types";
import ROUTES from "@/lib/types/routes";
import { zodResolver } from "@hookform/resolvers/zod";

import Spinner from "../ui/Spinner";

type GetPasswordResetTokenResponse =
  paths["/auth/email/get-reset-token/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

const ForgotPasswordForm = () => {
  const { addAlert, addErrorAlert } = useAlertQueue();
  const { id } = useTypedParams(ROUTES.PASSWORD_RESET.FORM);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);
  const [signupToken, setSignupToken] =
    useState<GetPasswordResetTokenResponse | null>(null);
  const auth = useAuthentication();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordType>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  useEffect(() => {
    const fetchPasswordResetToken = async () => {
      if (id === undefined) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await auth.client.GET(
          "/auth/email/get-reset-token/{id}",
          {
            params: {
              path: { id },
            },
          },
        );
        if (error) {
          navigate(ROUTES.LOGIN.path);
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
    fetchPasswordResetToken();
  }, [id]);

  const onSubmit: SubmitHandler<ResetPasswordType> = async (
    data: ResetPasswordType,
  ) => {
    setIsButtonLoading(true);
    if (!signupToken?.id) {
      addErrorAlert("Token is missing. Please try again.");
      return;
    }

    try {
      const { error } = await auth.client.POST("/auth/email/reset-password", {
        body: {
          token: signupToken.id,
          new_password: data.new_password,
        },
      });

      if (error) {
        navigate(ROUTES.LOGIN.path);
        addErrorAlert(error);
      } else {
        addAlert("Your password has been successfully updated.", "success");
        navigate("/login");
      }
    } catch (err) {
      addErrorAlert(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center ">
      <Card className="w-[400px] bg-gray-12  rounded-lg">
        <CardHeader className="pb-2">
          <Header title="Reset your Password" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="text-center">
              <p>Enter a new password below to reset your password. </p>
              {/* Password Input */}
              <PasswordInput<ResetPasswordType>
                placeholder="Password"
                register={register}
                errors={errors}
                name="new_password"
                showStrength={true}
              />
              {/* Confirm Password Input */}
              <PasswordInput<ResetPasswordType>
                placeholder="Confirm Password"
                register={register}
                errors={errors}
                name="confirmPassword"
                showStrength={false}
              />
              <Button variant="outline">
                {isButtonLoading ? <Spinner /> : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;
