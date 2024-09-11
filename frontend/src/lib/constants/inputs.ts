export const isValidEmail = (email: string) => {
  return email.length >= 5 && email.length <= 100 && email.includes("@");
};

export const EMAIL_MESSAGE = "Email must be between 5 and 100 characters.";

export const isValidPassword = (password: string) => {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    password.match(/[a-z]/) &&
    password.match(/[A-Z]/) &&
    password.match(/[0-9]/)
  );
};

export const PASSWORD_MESSAGE =
  "Password must be between 8 and 128 characters and contain a lowercase letter, uppercase letter, and number.";
