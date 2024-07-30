import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email should be end at @gmail",
    })
    .min(1, { message: "Email Required" })
    .email("Invalid Email"),
  password: z
    .string({
      required_error: "Password is Required",
    })
    .min(4, { message: "Password Required" }),
});

export const SignUpSchema = z
  .object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .min(1, { message: "Email Required" })
      .email("Invalid Email"),
    password: z
      .string({
        required_error: "Password is Required",
      })
      .min(4, { message: "Password Required" }),
    confirmPassword: z
      .string({
        required_error: "Confirm Password is Required",
      })
      .min(4, { message: "Confirm Password Required" }),
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: "Password not matched",
    path: ["confirm"],
  });

export type LoginType = z.infer<typeof LoginSchema>;
export type SignupType = z.infer<typeof SignUpSchema>;
