import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "components/ui/Button/Button";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";
import { useState } from "react";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import { SignUpSchema, SignupType } from "types";

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupType>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmit: SubmitHandler<SignupType> = async (data: SignupType) => {
    // TODO: Add an api endpoint to send the credentials details to backend and email verification.
    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 space-y-6"
    >
      {/* Email */}
      <div>
        <Input placeholder="Email" type="text" {...register("email")} />
        {errors?.email && <ErrorMessage>{errors?.email?.message}</ErrorMessage>}
      </div>

      {/* Password */}
      <div className="relative">
        <Input
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          {...register("password")}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {showPassword ? (
            <EyeSlash
              onClick={() => setShowPassword(false)}
              className="cursor-pointer"
            />
          ) : (
            <Eye
              onClick={() => setShowPassword(true)}
              className="cursor-pointer"
            />
          )}
        </div>
      </div>
      {errors?.password && (
        <ErrorMessage>{errors?.password?.message}</ErrorMessage>
      )}

      {/* Confirm Password */}
      <div className="relative">
        <Input
          placeholder="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          {...register("confirmPassword")}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {showConfirmPassword ? (
            <EyeSlash
              onClick={() => setShowConfirmPassword(false)}
              className="cursor-pointer"
            />
          ) : (
            <Eye
              onClick={() => setShowConfirmPassword(true)}
              className="cursor-pointer"
            />
          )}
        </div>
      </div>
      {errors?.confirmPassword && (
        <ErrorMessage>{errors?.confirmPassword?.message}</ErrorMessage>
      )}

      <Button type="submit" className="w-full">
        Signup
      </Button>
    </form>
  );
};

export default SignupForm;
