import {
  getConnectionStringFromEnvironment,
  getPrismaClient,
} from '@/prisma/client-handle';
import { execSync } from 'node:child_process';
import os from 'os';

export default async function createTestDatabases() {
  // mirror default vitest check for disabled watch
  // see https://vitest.dev/config/watch.html
  const watchIsDisabled = !process.env.CI && process.stdin.isTTY;
  // Vitest uses half of os.availableParallelism when watch is disabled
  // see https://vitest.dev/config/fileparallelism.html#fileparallelism
  const maxWorkers = os.availableParallelism() / (watchIsDisabled ? 1 : 2); // match Vitest pool size

  const adminClient = getPrismaClient(
    getConnectionStringFromEnvironment({
      database: 'postgres',
    }),
  );

  await adminClient.$connect();

  for (let i = 1; i <= maxWorkers; i++) {
    const dbName = `test_db_${i}`;

    const exists = await adminClient.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM pg_database WHERE datname = ${dbName}
      ) as "exists"
    `;

    if (!exists[0].exists) {
      console.log(`Creating database ${i} of ${maxWorkers}`);
      await adminClient.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);

      await verifyDatabase(dbName);

      // run migrations
      execSync(`npx prisma migrate deploy --schema=./prisma/schema.prisma`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: getConnectionStringFromEnvironment({
            database: dbName,
          }),
        },
      });
    }
  }

  await adminClient.$disconnect();
}

export async function verifyDatabase(dbName: string) {
  const adminClient = getPrismaClient(
    getConnectionStringFromEnvironment({
      database: 'postgres',
    }),
  );
  await adminClient.$connect();

  try {
    const result = await adminClient.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT FROM pg_database WHERE datname = ${dbName}) as exists
    `;

    if (!result[0]?.exists) {
      throw new Error(`Database ${dbName} does not exist after creation!`);
    }

    // Quick sanity check: can we connect?

    const workerClient = getPrismaClient(
      getConnectionStringFromEnvironment({
        database: dbName,
      }),
    );
    await workerClient.$connect();
    await workerClient.$queryRaw`SELECT 1`;
    await workerClient.$disconnect();
  } finally {
    await adminClient.$disconnect();
  }
}
