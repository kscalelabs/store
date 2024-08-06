import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";
import React, { useState } from "react";
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import zxcvbn from "zxcvbn";

interface PasswordInputProps<T extends FieldValues> {
  placeholder: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>; // Updated type to Path<T>
  showStrength?: boolean;
}

const PasswordInput = <T extends FieldValues>({
  placeholder,
  register,
  errors,
  name,
  showStrength = false,
}: PasswordInputProps<T>) => {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || ""; // Ensure value is a string
    setPassword(value);
    if (showStrength) {
      const result = zxcvbn(value);
      setPasswordStrength(result.score);
    }
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return "bg-red-500";
      case 1:
        return "bg-orange-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Okay";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
          {...register(name, { onChange: handlePasswordChange })}
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
      {errors[name] && (
        <ErrorMessage>{String(errors[name]?.message)}</ErrorMessage>
      )}
      {showStrength && password.length > 0 && (
        <>
          <div className="mt-4 h-2 w-full bg-gray-200 rounded">
            <div
              className={`h-full ${getStrengthColor(passwordStrength)} rounded`}
              style={{ width: `${(passwordStrength + 1) * 20}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Password Strength: {getStrengthLabel(passwordStrength)}
          </div>
          {passwordStrength < 2 ? (
            <div className="mt-1 text-xs text-red-500">
              Please enter a stronger password
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default PasswordInput;
