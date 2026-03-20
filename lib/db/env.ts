type EnvValue = string | undefined;

export function requireEnv(name: string, value: EnvValue): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
