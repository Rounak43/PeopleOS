const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
      console.warn(`[MongoDB] Local MongoDB server not reachable at ${uri}.`);
      console.log('[MongoDB] Starting built-in MongoDB instance for development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create({
          instance: { dbName: 'peopleos' },
        });
        const memoryUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] Built-in MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (memErr) {
        console.error(`[MongoDB] Failed to start in-memory MongoDB: ${memErr.message}`);
        throw error;
      }
    }
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    throw error;
  }
};

// Event Listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB Event Error] ${err.message}`);
});

process.on('SIGINT', async () => {
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  process.exit(0);
});

module.exports = {
  connectDB,
  mongoose,
};

