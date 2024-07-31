import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "components/ui/Button/Button";
import CardWrapper from "components/ui/Card/CardWrapper";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { Eye } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import { LoginSchema, LoginType } from "types";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginType>({
    resolver: zodResolver(LoginSchema),
  });

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [useSpinner, setUseSpinner] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const onSubmit: SubmitHandler<LoginType> = async (data: LoginType) => {
    // TODO: Add an api endpoint to send the credentials details to backend.
    console.log(data);
  };

  const handleGithubSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    const { data, error } = await auth.client.GET("/users/github/login");
    if (error) {
      addErrorAlert(error);
    } else {
      window.open(data, "_self");
    }
  };

  useEffect(() => {
    (async () => {
      // Get the code from the query string to carry out OAuth login.
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const code = params.get("code");

      if (code) {
        setUseSpinner(true);
        const { data, error } = await auth.client.POST("/users/github/code", {
          body: { code },
        });

        if (error) {
          addErrorAlert(error);
          setUseSpinner(false);
        } else {
          auth.login(data.api_key);
          setUseSpinner(false);
        }
      }
    })();
  }, []);

  return (
    <div>
      {useSpinner ? (
        <Spinner animation="border" />
      ) : (
        <div className="flex justify-center items-center min-h-svh">
          <CardWrapper
            backButtonHref="/signup"
            headerLabel="Welcome Back!"
            showProvider
            backButtonLabel="Don't have an account? Create a new account."
            loginWithGithub={handleGithubSubmit}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 space-y-6"
            >
              <div>
                <Input placeholder="Email" type="text" {...register("email")} />
                {errors?.email && (
                  <ErrorMessage>{errors?.email?.message}</ErrorMessage>
                )}
              </div>
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
          </CardWrapper>
        </div>
      )}
    </div>
  );
};

export default Login;
