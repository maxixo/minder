import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('error', (err) => console.error(`MongoDB error: ${err}`));
    mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error: any) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
