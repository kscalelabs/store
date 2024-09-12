import { z } from "zod";
import zxcvbn from "zxcvbn";

export const LoginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email should be end at @gmail",
    })
    .min(1, { message: "Email is required." })
    .email("Invalid Email"),
  password: z
    .string({
      required_error: "Password is required.",
    })
    .min(4, { message: "Password is required." }),
});

export type LoginType = z.infer<typeof LoginSchema>;

export const EmailSignupSchema = z.object({
  email: z
    .string({
      required_error: "Email required.",
    })
    .min(3, { message: "Email required." })
    .email("Invalid email."),
});

export type EmailSignupType = z.infer<typeof EmailSignupSchema>;

export const SignUpSchema = z
  .object({
    email: z
      .string({
        required_error: "Email required.",
      })
      .min(1, { message: "Email required." })
      .email("Invalid email."),
    password: z
      .string({
        required_error: "Password required.",
      })
      .min(8, { message: "Password must be at least 8 characters long." })
      .refine(
        (password) => {
          const result = zxcvbn(password);
          return result.score >= 2;
        },
        {
          message: "Password is too weak.",
        },
      ),
    confirmPassword: z
      .string({
        required_error: "Must confirm password.",
      })
      .min(8, {
        message: "Must confirm password with length at least 8 characters.",
      }),
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupType = z.infer<typeof SignUpSchema>;

export const NewListingSchema = z.object({
  name: z
    .string({ required_error: "Name is required." })
    .min(4, { message: "Name must be at least 4 characters long." }),
  description: z
    .string({ required_error: "Description is required." })
    .min(6, { message: "Description must be at least 6 characters long." }),
});

export type NewListingType = z.infer<typeof NewListingSchema>;

export type FormType = "edit" | "string";
