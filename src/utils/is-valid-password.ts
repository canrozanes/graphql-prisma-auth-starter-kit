export const isValidPassword = (password: string): boolean =>
  password.length >= 8 && !password.toLowerCase().includes("password");
