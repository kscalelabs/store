import React, { useState } from "react";
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import ErrorMessage from "@/components/ui/ErrorMessage";
import zxcvbn from "zxcvbn";

import { Input } from "./Input";

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
        return "red-500";
      case 1:
        return "orange-500";
      case 2:
        return "yellow-500";
      case 3:
        return "blue-500";
      case 4:
        return "green-500";
      default:
        return "gray-300";
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
          <div className="mt-4 h-2 w-full bg-gray-4 rounded">
            <div
              className={`h-full bg-${getStrengthColor(passwordStrength)} rounded`}
              style={{ width: `${(passwordStrength + 1) * 20}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-10">
            Password Strength:{" "}
            <span
              className={`font-semibold text-${getStrengthColor(passwordStrength)}`}
            >
              {getStrengthLabel(passwordStrength)}
            </span>
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
