import { SubmitHandler, useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import ErrorMessage from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input/Input";
import PasswordInput from "@/components/ui/Input/PasswordInput";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { LoginSchema, LoginType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginType>({
    resolver: zodResolver(LoginSchema),
  });

  const { addAlert, addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();

  const onSubmit: SubmitHandler<LoginType> = async (data: LoginType) => {
    try {
      const { data: response, error } = await auth.client.POST("/users/login", {
        body: data,
      });

      if (error) {
        addErrorAlert(error);
      } else {
        addAlert(`Logged in! Welcome back!`, "success");
        auth.login(response.token);
      }
    } catch {
      addErrorAlert("An unexpected error occurred during login.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        {/* Email Input */}
        <div className="relative">
          <Input placeholder="Email" type="text" {...register("email")} />
          {errors?.email && (
            <ErrorMessage>{errors?.email?.message}</ErrorMessage>
          )}
        </div>
        {/* Password Input */}
        <div className="mt-5">
          <PasswordInput<LoginType>
            placeholder="Password"
            register={register}
            errors={errors}
            name="password"
            showStrength={false} // Hide password strength bar
          />
        </div>
      </div>
      {/* Forgot Link */}
      <Button variant="link" className="justify-start px-1 py-6">
        <Link to="/forgot-password">Forgot Password?</Link>
      </Button>
      {/* Submit Button */}
      <div className="mt-2">
        <Button variant="primary">Login</Button>
      </div>
    </form>
  );
};

export default LoginForm;
