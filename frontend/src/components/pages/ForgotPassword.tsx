import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { EmailSignupSchema, EmailSignupType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";

interface ForgotPasswordResponse {
  message: string;
}

const ForgotPassword = () => {
  const { addAlert, addErrorAlert } = useAlertQueue();
  const [loading, setLoading] = useState<boolean>(false);

  const auth = useAuthentication();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSignupType>({ resolver: zodResolver(EmailSignupSchema) });

  const onSubmit = async ({ email }: EmailSignupType) => {
    setLoading(true);

    try {
      const { data, error } = await auth.client.POST("/users/forgot-password", {
        body: {
          email,
        },
      });

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
    <div className="flex justify-center items-center">
      <Card className="w-[400px] shadow-md bg-gray-2 text-gray-12 rounded-lg">
        <CardHeader className="pb-0">
          <Header title="Reset your Password" />
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-11">
            Enter your registered email to receive a secure link for resetting
            your password.
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="my-6">
              <Input placeholder="Email" type="text" {...register("email")} />
              {errors?.email && (
                <ErrorMessage>{errors?.email?.message}</ErrorMessage>
              )}
            </div>
            <Button variant="primary" disabled={loading}>
              {loading ? <Spinner /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => navigate("/login")}
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
