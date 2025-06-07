const jwt = require('jsonwebtoken');
const Token = require('../models/Token');
const ApiError = require('../utils/apiError');
const ms = require('ms');

class TokenService {
  // Generate access and refresh tokens
  static generateTokens(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { ...payload, tokenType: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Store refresh token in database
  static async storeRefreshToken(userId, refreshToken, userAgent, ipAddress) {
    try {
      // Revoke any existing tokens for this user and user agent
      await Token.updateMany(
        { user: userId, userAgent, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );

      // Calculate token expiration
      const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
      const expiresAt = new Date(Date.now() + ms(refreshTokenExpiresIn));

      // Create new token
      const tokenDoc = new Token({
        user: userId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt
      });

      await tokenDoc.save();
      return tokenDoc;
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw new ApiError(500, 'Error storing refresh token');
    }
  }

  // Generate and store tokens
  static async generateAndStoreTokens(user, userAgent, ipAddress) {
    try {
      const tokens = this.generateTokens(user);
      await this.storeRefreshToken(user._id, tokens.refreshToken, userAgent, ipAddress);
      return tokens;
    } catch (error) {
      console.error('Error in generateAndStoreTokens:', error);
      throw error;
    }
  }

  // Refresh access token using refresh token
  static async refreshAccessToken(refreshToken, userAgent, ipAddress) {
    try {
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      // Verify the refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Check if the token exists and is not revoked
      const existingToken = await Token.findOne({
        refreshToken,
        user: decoded.userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      });

      if (!existingToken) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      // Check if user agent matches
      if (existingToken.userAgent !== userAgent) {
        // Security measure: Revoke all tokens for this user
        await this.revokeAllUserTokens(decoded.userId);
        throw new ApiError(401, 'Security alert: Invalid user agent');
      }

      // Get user from database
      const User = require('../models/User');
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);
      
      // Revoke the old refresh token
      await this.revokeToken(refreshToken);
      
      // Store the new refresh token
      await this.storeRefreshToken(user._id, tokens.refreshToken, userAgent, ipAddress);

      return tokens;
    } catch (error) {
      console.error('Error in refreshAccessToken:', error);
      throw error;
    }
  }

  // Verify access token
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Access token expired');
      }
      throw new ApiError(401, 'Invalid access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Refresh token expired');
      }
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  // Get token from request
  static getTokenFromRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }

  // Revoke a token
  static async revokeToken(refreshToken) {
    try {
      const tokenDoc = await Token.findOneAndUpdate(
        { refreshToken, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() },
        { new: true }
      );

      if (!tokenDoc) {
        throw new ApiError(404, 'Token not found or already revoked');
      }

      return tokenDoc;
    } catch (error) {
      console.error('Error revoking token:', error);
      throw new ApiError(500, 'Error revoking token');
    }
  }

  // Revoke all tokens for a user
  static async revokeAllUserTokens(userId) {
    try {
      await Token.updateMany(
        { user: userId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
      return true;
    } catch (error) {
      console.error('Error revoking user tokens:', error);
      throw new ApiError(500, 'Error revoking user tokens');
    }
  }
}

module.exports = TokenService;