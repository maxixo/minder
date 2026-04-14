import mongoose from 'mongoose';

type DatabaseConnection = Pick<typeof mongoose.connection, 'on' | 'close'>;

type DatabaseClient = {
  connect: typeof mongoose.connect;
  connection: DatabaseConnection;
};

type ProcessLike = Pick<NodeJS.Process, 'on' | 'exit'>;

const connectDB = async (
  dbClient: DatabaseClient = mongoose,
  processRef: ProcessLike = process,
): Promise<void> => {
  try {
    const conn = await dbClient.connect(process.env.MONGODB_URI as string);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    dbClient.connection.on('error', (err) => console.error(`MongoDB error: ${err}`));
    dbClient.connection.on('disconnected', () => console.log('MongoDB disconnected'));
    processRef.on('SIGINT', async () => {
      await dbClient.connection.close();
      processRef.exit(0);
    });
  } catch (error: any) {
    console.error(`MongoDB connection failed: ${error.message}`);
    processRef.exit(1);
  }
};

export default connectDB;
