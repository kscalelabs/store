import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email Required" })
    .email("Invalid Email"),
  passowrd: z.string().min(4, { message: "Password Required" }),
});
