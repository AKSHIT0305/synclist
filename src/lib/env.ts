import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url({ message: 'must be your Supabase project URL' }),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'must be your Supabase anon/publishable key'),
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z
    .string()
    .regex(/\.apps\.googleusercontent\.com$/, 'must be a Google "Web application" OAuth client id'),
  EXPO_PUBLIC_ENABLE_PHONE_OTP: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type Env = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleWebClientId: string;
  enablePhoneOtp: boolean;
};

export class EnvError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid app configuration:\n${issues.map((i) => `  • ${i}`).join('\n')}`);
    this.name = 'EnvError';
  }
}

export type RawEnv = Partial<Record<keyof z.input<typeof envSchema>, string | undefined>>;

/** Pure: validates raw env values. Throws EnvError listing every problem at once. */
export function parseEnv(raw: RawEnv): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`),
    );
  }
  const e = result.data;
  return {
    supabaseUrl: e.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: e.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleWebClientId: e.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    enablePhoneOtp: e.EXPO_PUBLIC_ENABLE_PHONE_OTP,
  };
}

let cached: Env | undefined;

/**
 * The app's validated env. Expo only inlines EXPO_PUBLIC_* vars that are referenced
 * statically, so each one is listed explicitly here.
 */
export function getEnv(): Env {
  cached ??= parseEnv({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_ENABLE_PHONE_OTP: process.env.EXPO_PUBLIC_ENABLE_PHONE_OTP,
  });
  return cached;
}
