import { SubmitHandler, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { LoginSchema, LoginType } from "types";

import { Button } from "components/ui/Button/Button";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";
import PasswordInput from "components/ui/Input/PasswordInput";

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
