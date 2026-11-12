import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/cms-guide'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_NAME: z.string().default('cms_token'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  // Falls back to the public URL Render provides, so a Render deploy needs no extra setting.
  CLIENT_ORIGIN: z.string().default(process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173'),
  /** Serve the built client from this directory (production single-container deploy). */
  CLIENT_DIST: z.string().optional(),

  // Media storage. When AWS_S3_BUCKET is empty, files are stored on local disk (dev only).
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  CLOUDFRONT_URL: z.string().optional().default(''),
  LOCAL_UPLOAD_DIR: z.string().default('./uploads'),

  // Search. Set to the Atlas Search index name to use $search; otherwise a text index is used.
  ATLAS_SEARCH_INDEX: z.string().optional().default(''),

  /** Seed the admin account and sample content on startup when the database has no users. */
  SEED_ON_START: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SEED_ADMIN_EMAIL: z.string().default('admin@example.com'),
  SEED_ADMIN_PASSWORD: z.string().default('ChangeMe@123'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  cookieSecure: parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === 'production',
  useS3: Boolean(parsed.data.AWS_S3_BUCKET),
  corsOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((s) => s.trim()),
};
