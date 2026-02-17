import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export interface DatabaseURLParams {
  user: string | undefined;
  password: string | undefined;
  database: string | undefined;
  port: string | undefined;
  host: string;
}

export type ConnectionStringOverrides = Partial<DatabaseURLParams>;

export function getConnectionStringFromEnvironment(
  overrides?: ConnectionStringOverrides,
) {
  const urlParams: DatabaseURLParams = {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB,
  };

  if (overrides) {
    for (const key in overrides) {
      const override = overrides[key as keyof DatabaseURLParams];
      if (override) urlParams[key as keyof DatabaseURLParams] = override;
    }
  }

  for (const key in urlParams) {
    if (!urlParams[key as keyof DatabaseURLParams])
      throw new Error(`Environment variable ${key} is not defined`);
  }
  const { user, password, database, port, host } = urlParams;

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
}

export function getPrismaClient(connectionString?: string) {
  const url = connectionString ?? getConnectionStringFromEnvironment();
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}
