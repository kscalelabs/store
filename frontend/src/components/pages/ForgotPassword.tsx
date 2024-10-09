import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Header from "@/components/ui/Header";
import { Input } from "@/components/ui/Input/Input";
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

  const auth = useAuthentication();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSignupType>({ resolver: zodResolver(EmailSignupSchema) });

  const onSubmit = async ({ email }: EmailSignupType) => {
    try {
      const { data, error } = await auth.client.POST("/users/forgot-password", {
        body: {
          email: email,
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        const responseData = data as ForgotPasswordResponse;
        const successMessage =
          responseData?.message ||
          "A password reset email has been sent to your registered email address.";
        addAlert(successMessage, "success");
      }
    } catch {
      addErrorAlert("An unexpected error occurred during login.");
    }
  };

  return (
    <div className="flex justify-center items-center">
      <Card className="w-[400px] shadow-md bg-gray-2 text-gray-12 rounded-lg">
        <CardHeader className="pb-2">
          <Header title="Reset your Password" />
        </CardHeader>
        <CardContent className="text-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 space-y-6"
          >
            <p className="text-sm text-gray-11">
              Enter your registered email to receive a secure link for resetting
              your password.
            </p>
            <Input placeholder="Email" type="text" {...register("email")} />
            {errors?.email && (
              <ErrorMessage>{errors?.email?.message}</ErrorMessage>
            )}
            <Button variant="primary">Continue</Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="link" className="w-full">
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
