import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Header from "@/components/ui/Header";
import { Input } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ForgotPasswordSchema, ForgotPasswordType } from "@/lib/types";
import ROUTES from "@/lib/types/routes";
import { zodResolver } from "@hookform/resolvers/zod";

interface ForgotPasswordResponse {
  message: string;
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [loading, setLoading] = useState<boolean>(false);

  const auth = useAuthentication();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordType>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordType> = async ({
    email,
  }: ForgotPasswordType) => {
    setLoading(true);

    try {
      const { data, error } = await auth.client.POST(
        "/auth/email/forgot-password",
        {
          body: {
            email,
          },
        },
      );

      if (error) {
        addErrorAlert(error);
      } else {
        const responseData = data as ForgotPasswordResponse;
        const successMessage =
          responseData?.message ||
          "If the email is registered, a password reset link will be sent.";
        addAlert(successMessage, "success");
      }
    } catch {
      addErrorAlert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center ">
      <Card className="w-[400px] bg-gray-12  rounded-lg">
        <CardHeader>
          <Header title="Reset your Password" />
        </CardHeader>
        <CardContent className="text-center">
          <form onSubmit={handleSubmit(onSubmit)}>
            <p>
              Enter your registered email to receive a secure link for resetting
              your password.
            </p>
            {/* Email Input */}
            <div>
              <Input placeholder="Email" type="text" {...register("email")} />
              {errors?.email && (
                <ErrorMessage>{errors?.email?.message}</ErrorMessage>
              )}
            </div>
            <Button variant="outline" disabled={loading}>
              {loading ? <Spinner /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => navigate(ROUTES.LOGIN.path)}
            variant="link"
            className="w-full"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
