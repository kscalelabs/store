import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginType } from "types";

import { Button } from "components/ui/Button/Button";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginType>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit: SubmitHandler<LoginType> = async (data: LoginType) => {
    // TODO: Add an API endpoint to send the credentials details to backend and handle authentication.
    console.log(data);
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
      {/* Password Input */}
      <PasswordInput<LoginType>
        placeholder="Password"
        register={register}
        errors={errors}
        name="password"
        showStrength={false} // Hide password strength bar
      />
      {/* Submit Button */}
      <Button
        variant="outline"
        className="w-full text-white bg-blue-600 hover:bg-opacity-70"
      >
        Login
      </Button>
    </form>
  );
};

export default LoginForm;
