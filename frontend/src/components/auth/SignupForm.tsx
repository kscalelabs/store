import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import ErrorMessage from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input/Input";
import PasswordInput from "@/components/ui/Input/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { SignUpSchema, SignupType } from "@/lib/types";
import ROUTES from "@/lib/types/routes";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";

interface SignupFormProps {
  signupTokenId: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ signupTokenId }) => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupType>({
    resolver: zodResolver(SignUpSchema),
  });

  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";
  const passwordStrength = password.length > 0 ? zxcvbn(password).score : 0;

  useEffect(() => {
    const validateToken = async () => {
      try {
        const { error } = await auth.client.GET("/auth/email/signup/get/{id}", {
          params: {
            path: { id: signupTokenId },
          },
        });

        if (error) {
          addErrorAlert(error);
          navigate(ROUTES.HOME.path);
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [signupTokenId]);

  if (isValidating) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  const onSubmit: SubmitHandler<SignupType> = async (data: SignupType) => {
    // Exit account creation early if password too weak or not matching
    if (passwordStrength < 2) {
      addErrorAlert("Please enter a stronger password");
      return;
    } else if (password !== confirmPassword) {
      addErrorAlert("Passwords do not match");
      return;
    }

    try {
      const { error } = await auth.client.POST("/auth/email/signup", {
        body: {
          signup_token_id: signupTokenId,
          email: data.email,
          password: data.password,
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        addAlert("Registration successful! You can now log in.", "success");
        navigate(ROUTES.LOGIN.path);
        // Sign user in automatically?
      }
    } catch (err) {
      addErrorAlert(err);
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
      <PasswordInput<SignupType>
        placeholder="Password"
        register={register}
        errors={errors}
        name="password"
        showStrength={true}
      />
      {/* Confirm Password Input */}
      <PasswordInput<SignupType>
        placeholder="Confirm Password"
        register={register}
        errors={errors}
        name="confirmPassword"
        showStrength={false}
      />
      {/* TOS Text */}
      <div className="text-xs text-center text-gray-2">
        By signing up, you agree to our <br />
        <Link to={ROUTES.TOS.path} className="text-primary-9 underline ml-1">
          terms and conditions
        </Link>{" "}
        and{" "}
        <Link
          to={ROUTES.PRIVACY.path}
          className="text-primary-9 underline ml-1"
        >
          privacy policy
        </Link>
        .
      </div>
      {/* Signup Button */}
      <Button variant="outline">Sign up</Button>
    </form>
  );
};

export default SignupForm;
