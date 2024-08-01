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

export type LoginType = z.infer<typeof LoginSchema>;

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

export type SignupType = z.infer<typeof SignUpSchema>;

export const NewListingSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(4, { message: "Name is required" }),
  description: z
    .string({ required_error: "Description is required" })
    .min(6, { message: "Description is required" }),
});

export type NewListingType = z.infer<typeof NewListingSchema>;
