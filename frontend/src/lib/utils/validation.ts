export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(username);
};
