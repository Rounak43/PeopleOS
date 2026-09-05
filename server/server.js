require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedInitialData } = require('./config/seedData');

const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  console.log('  PeopleOS API Server — Starting...');
  try {
    await connectDB();
    await seedInitialData();
  } catch (err) {
    console.error('[FATAL] Cannot connect to MongoDB database:');
    console.error(`        ${err.message}`);
    console.error('        Make sure MongoDB Server is running and MONGODB_URI in .env is correct.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`  Running on:  http://localhost:${PORT}`);
    console.log(`  Health:      http://localhost:${PORT}/api/health`);
    console.log(`  Env:         ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch((err) => {
  console.error('[FATAL] Unexpected startup error:', err);
  process.exit(1);
});
