import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET should be at least 16 chars').default('change-me-in-prod-please'),
  SERVICE_FEE_BPS: z.string().default('250'),
  DATABASE_URL: z.string().optional(),
  BASE_URL: z.string().default('http://localhost:3000')
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT!, 10),
  jwtSecret: parsed.data.JWT_SECRET!,
  serviceFeeBps: parseInt(parsed.data.SERVICE_FEE_BPS!, 10),
  baseUrl: parsed.data.BASE_URL!
};
