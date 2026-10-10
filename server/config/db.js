const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Read MongoDB connection string from .env
    const mongoUri = process.env.MONGODB_URI;

    // Check whether the connection string exists
    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI is missing. Please configure it in your .env file.'
      );
    }

    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;