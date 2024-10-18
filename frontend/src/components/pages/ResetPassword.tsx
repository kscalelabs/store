import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import PasswordInput from "@/components/ui/Input/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ResetPasswordSchema, ResetPasswordType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";

const ResetPassword = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState<boolean>(false);

  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordType>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const onSubmit: SubmitHandler<ResetPasswordType> = async (
    data: ResetPasswordType,
  ) => {
    setLoading(true);
    if (!token) {
      addErrorAlert("Token is missing. Please try again.");
      return;
    }

    try {
      const { error } = await auth.client.POST("/users/reset-password", {
        body: {
          token: token,
          new_password: data.new_password,
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        addAlert("Your password has been successfully updated.", "success");
        navigate("/login");
      }
    } catch (err) {
      addErrorAlert(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center">
      <Card className="w-[400px] shadow-md bg-gray-2 text-gray-12 rounded-lg">
        <CardHeader className="pb-2">
          <Header title="Reset your Password" />
        </CardHeader>
        <CardContent className="text-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 space-y-6"
          >
            <p className="text-sm text-gray-11 mx-2">
              Enter a new password below to reset your password.{" "}
            </p>
            {/* Password Input */}
            <PasswordInput<ResetPasswordType>
              placeholder="Password"
              register={register}
              errors={errors}
              name="new_password"
              showStrength={true}
            />
            {/* Confirm Password Input */}
            <PasswordInput<ResetPasswordType>
              placeholder="Confirm Password"
              register={register}
              errors={errors}
              name="confirmPassword"
              showStrength={false}
            />
            <Button variant="primary" disabled={loading}>
              {loading ? <Spinner /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
