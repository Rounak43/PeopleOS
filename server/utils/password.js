const crypto = require('crypto');

/**
 * Hash password using PBKDF2 with unique salt
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verify password against stored hash or plaintext fallback
 */
const verifyPassword = (password, storedHash) => {
  if (!storedHash) return false;
  
  // If stored as salt:hash
  if (storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }
  
  // Fallback for simple testing string comparison
  return password === storedHash;
};

module.exports = {
  hashPassword,
  verifyPassword,
};
