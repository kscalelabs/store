import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "components/ui/Button/Button";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { LoginSchema, LoginType } from "types";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginType>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit: SubmitHandler<LoginType> = async (data: LoginType) => {
    // TODO: Add an api endpoint to send the credentials details to backend and email verification.
    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 space-y-6"
    >
      {/* Email */}
      <div className="relative">
        <Input placeholder="Email" type="text" {...register("email")} />
        {errors?.email && <ErrorMessage>{errors?.email?.message}</ErrorMessage>}
      </div>

      {/* Password */}
      <div className="relative">
        <div className="relative">
          <Input
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {showPassword ? (
              <FaEyeSlash
                onClick={() => setShowPassword(false)}
                className="cursor-pointer"
              />
            ) : (
              <FaEye
                onClick={() => setShowPassword(true)}
                className="cursor-pointer"
              />
            )}
          </div>
        </div>
        {errors?.password && (
          <ErrorMessage>{errors?.password?.message}</ErrorMessage>
        )}
      </div>

      {/* Submit Button */}
      <Button
        variant="outline"
        className="w-full hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        Login
      </Button>
    </form>
  );
};

export default LoginForm;
