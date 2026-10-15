import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  accessPassword: required("ACCESS_PASSWORD"),
  // 목자 전용 암호. 설정하지 않으면 목자도 공유 암호로 로그인합니다.
  leaderPassword: process.env.LEADER_PASSWORD || undefined,
  jwtSecret: required("JWT_SECRET"),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
};
