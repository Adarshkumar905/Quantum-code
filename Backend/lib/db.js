import mongoose from 'mongoose';

let cachedConnection = null;

export const connectToDatabase = async () => {
  // already have a connection,don't connect again
  if (cachedConnection) {
    return;
  }

  // Get the database URL from environment variables
  const DB_URL = process.env.DB_URL;

  if (!DB_URL) {
    throw new Error(
      "Please define the DB_URL environment variable inside .env"
    );
  }

  try {
    //connect to the database
    const mongooseInstance = await mongoose.connect(DB_URL, {
      bufferCommands: true,
    });
    
    cachedConnection = mongooseInstance.connection;

  } catch (err) {
    console.error("Mongo Connection Error:", err);
    process.exit(1);
  }
};