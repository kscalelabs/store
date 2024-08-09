import { SubmitHandler, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { EmailSignUpSchema, EmailSignUpType } from "types";

import { Button } from "components/ui/Button/Button";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";

const SignupWithEmail = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSignupType>({
    resolver: zodResolver(EmailSignUpSchema),
  });

  const onSubmit: SubmitHandler<EmailSignupType> = async (
    data: EmailSignupType,
  ) => {
    // TODO: Add an api endpoint to create EmailSignUpToken and send email to
    //       submitted email. User gets link in email to /register/{token}
    //       to finish sign up

    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 space-y-6">
      {/* Email Input */}
      <div className="relative">
        <Input placeholder="Email" type="text" {...register("email")} />
        {errors?.email && <ErrorMessage>{errors?.email?.message}</ErrorMessage>}
      </div>
      {/* Signup Button */}
      <Button
        variant="outline"
        className="w-full text-white bg-blue-600 hover:bg-opacity-70">
        Sign up with email
      </Button>
    </form>
  );
};

export default SignupWithEmail;
