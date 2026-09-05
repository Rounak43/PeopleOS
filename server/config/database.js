/**
 * PeopleOS — Database Configuration
 *
 * This file will hold the MySQL connection pool once the backend
 * developer configures the database integration.
 *
 * DO NOT modify the existing MySQL schema.
 * DO NOT drop or alter any tables.
 * The existing database is the source of truth.
 *
 * OWNER: Member 1 (Backend)
 */

// mysql2 will be installed by Member 1 when database integration begins.
// Placeholder:

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  database: process.env.DB_NAME || 'peopleos',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

// TODO (Member 1): Replace this with mysql2 connection pool.
// Example:
//   const mysql = require('mysql2/promise');
//   const pool = mysql.createPool(dbConfig);
//   module.exports = pool;

module.exports = dbConfig;
