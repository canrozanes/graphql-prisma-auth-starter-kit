export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && !password.toLowerCase().includes("password");
};
