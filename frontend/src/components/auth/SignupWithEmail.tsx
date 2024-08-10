import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { EmailSignupSchema, EmailSignupType } from "types";

import { Button } from "components/ui/Button/Button";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";

interface EmailSignUpResponse {
  message: string;
}

const SignupWithEmail = () => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSignupType>({
    resolver: zodResolver(EmailSignupSchema),
  });

  const onSubmit = async ({ email }: EmailSignupType) => {
    console.log(`email: ${email}`);
    const { data, error } = await auth.client.POST("/email-signup/create/", {
      body: {
        email,
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      const responseData = data as EmailSignUpResponse;
      const successMessage =
        responseData?.message || "Sign-up email sent! Check your inbox.";
      addAlert(successMessage, "success");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 space-y-6"
    >
      {/* Email Input */}
      <div className="relative">
        <Input placeholder="Email" type="text" {...register("email")} />
        {errors?.email && <ErrorMessage>{errors?.email?.message}</ErrorMessage>}
      </div>
      {/* Signup Button */}
      <Button
        variant="outline"
        className="w-full text-white bg-blue-600 hover:bg-opacity-70"
      >
        Sign up with email
      </Button>
    </form>
  );
};

export default SignupWithEmail;
