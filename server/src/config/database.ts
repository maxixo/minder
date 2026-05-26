import prisma from '../lib/prisma.js';

type DatabaseClient = Pick<typeof prisma, '$connect' | '$disconnect'>;
type ProcessLike = Pick<NodeJS.Process, 'on' | 'exit'>;

const getDatabaseUrlError = (databaseUrl: string | undefined) => {
  if (!databaseUrl) {
    return 'DATABASE_URL is required.';
  }

  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    return 'DATABASE_URL must use a PostgreSQL connection string.';
  }

  return null;
};

const connectDB = async (
  dbClient: DatabaseClient = prisma,
  processRef: ProcessLike = process,
): Promise<void> => {
  try {
    const databaseUrlError = getDatabaseUrlError(process.env.DATABASE_URL);
    if (databaseUrlError) {
      throw new Error(databaseUrlError);
    }

    await dbClient.$connect();
    console.log('PostgreSQL connected');

    processRef.on('SIGINT', async () => {
      await dbClient.$disconnect();
      processRef.exit(0);
    });
  } catch (error: any) {
    console.error(`PostgreSQL connection failed: ${error.message}`);
    processRef.exit(1);
  }
};

export default connectDB;
