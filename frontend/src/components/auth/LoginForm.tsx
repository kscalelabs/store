import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "components/ui/Button/Button";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";
import { useState } from "react";
import { Eye } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
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
        {errors?.password && (
          <ErrorMessage>{errors?.password?.message}</ErrorMessage>
        )}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Eye
            onClick={() => setShowPassword((p) => !p)}
            className="cursor-pointer"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  );
};

export default LoginForm;
