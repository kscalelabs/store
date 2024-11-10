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

// Base listing schema with common fields
const BaseListingSchema = z.object({
  name: z
    .string({ required_error: "Name is required." })
    .min(4, { message: "Name must be at least 4 characters long." }),
  description: z
    .string({ required_error: "Description is required." })
    .min(6, { message: "Description must be at least 6 characters long." }),
  slug: z
    .string({ required_error: "Slug is required." })
    .min(1, { message: "Slug is required." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Slug must contain only lowercase letters, numbers, and hyphens.",
    }),
});

// Schema for sharing builds (no price/inventory)
export const ShareListingSchema = BaseListingSchema;

// Schema for selling builds (includes price and inventory)
export const SellListingSchema = BaseListingSchema.extend({
  price_amount: z.number().nullable(),
  currency: z.string().default("usd"),
  inventory_type: z
    .enum(["finite", "infinite", "preorder"])
    .default("infinite"),
  inventory_quantity: z.number().nullable(),
  preorder_release_date: z.number().nullable(),
  is_reservation: z.boolean().default(false),
  reservation_deposit_amount: z.number().nullable(),
});

// Export types
export type ShareListingType = z.infer<typeof ShareListingSchema>;
export type SellListingType = z.infer<typeof SellListingSchema>;

export type FormType = "edit" | "string";
