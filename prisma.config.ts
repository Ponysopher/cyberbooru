import { defineConfig } from 'prisma/config';
import { getConnectionStringFromEnvironment } from './prisma/client-handle';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: getConnectionStringFromEnvironment(),
  },
});
