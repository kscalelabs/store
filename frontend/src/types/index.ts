import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email Required" })
    .email("Invalid Email"),
  password: z.string().min(4, { message: "Password Required" }),
});

export const SignUpSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: "Email Required" })
      .email("Invalid Email"),
    password: z.string().min(4, { message: "Password Required" }),
    confirmPassword: z.string().min(4, { message: "Enter valid password" }),
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: "Password not matched",
    path: ["confirm"],
  });
