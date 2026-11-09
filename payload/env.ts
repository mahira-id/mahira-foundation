/**
 * Reads a required server-side environment variable.
 * The error message names the variable only; it never includes a value.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}
