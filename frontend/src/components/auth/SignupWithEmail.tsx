import { useForm } from "react-hook-form";

import ErrorMessage from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { EmailSignupSchema, EmailSignupType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";

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
    const { data, error } = await auth.client.POST(
      "/auth/email/signup/create",
      {
        body: {
          email,
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      const responseData = data as EmailSignUpResponse;
      const successMessage =
        responseData?.message ||
        "Sign up email sent! Follow the link sent to you to continue registration.";
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
        className="bg-gray-12 text-gray-2 hover:bg-gray-9"
      >
        Sign up with email
      </Button>
    </form>
  );
};

export default SignupWithEmail;
