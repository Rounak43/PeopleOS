const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';

  try {
    const conn = await mongoose.connect(uri);

    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
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

module.exports = {
  connectDB,
  mongoose,
};
