/**
 * PeopleOS — Server Entry Point
 *
 * Loads environment variables and starts the HTTP server.
 */

require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('─────────────────────────────────────────');
  console.log(`  PeopleOS API Server`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Health:     http://localhost:${PORT}/api/health`);
  console.log(`  Env:        ${process.env.NODE_ENV || 'development'}`);
  console.log('─────────────────────────────────────────');
});
