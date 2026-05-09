const env = {
  PORT: parseInt(process.env.PORT ?? "8080", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "photogram-dev-secret",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV === "development",
} as const;

export default env;
