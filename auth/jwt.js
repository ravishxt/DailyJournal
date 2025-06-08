const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-256-bit-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

/**
 * Generate access token
 * @param {Object} user - User object
 * @returns {String} JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      role: user.role || 'user',
      type: 'access'
    },
    JWT_SECRET,
    { 
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'daily-journal-api',
      audience: ['web']
    }
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { 
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'daily-journal-api',
      audience: ['web']
    }
  );
};

/**
 * Verify access token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'daily-journal-api',
      audience: 'web'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    throw new Error('Invalid access token');
  }
};

/**
 * Verify refresh token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'daily-journal-api',
      audience: 'web'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
