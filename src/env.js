/**
 * Validates the required environment variables at startup.
 * Throws an error if any required variable is missing or empty.
 */

const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

export function validateEnv() {
  const missingVars = requiredEnvVars.filter((envVar) => !import.meta.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
