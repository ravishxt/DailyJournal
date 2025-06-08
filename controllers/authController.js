const User = require('../models/User');
const TokenService = require('../services/tokenService');
const { 
  generateTokens, 
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY 
} = require('../auth/jwt');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class AuthController {
  // User registration
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        throw new ApiError(400, 'Email or username already in use');
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        role: 'user' // Default role
      });

      await user.save();

      // Generate tokens
      const tokens = await TokenService.generateAndStoreTokens(
        user,
        req.get('user-agent') || '',
        req.ip
      );

      // Return user data and tokens
      return res.api.created({
        user: user.getPublicProfile(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      }, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  // User login
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
      }

      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        logger.error(`Login attempt failed: No user found with email ${email}`);
        throw new ApiError(401, 'Invalid email or password');
      }
      
      // Compare passwords
      const isMatch = await user.comparePassword(password);
      logger.info(`Password match for user ${user._id}:`, isMatch);
      
      if (!isMatch) {
        logger.error(`Login attempt failed: Incorrect password for user ${user._id}`);
        throw new ApiError(401, 'Invalid email or password');
      }

      // Generate tokens
      const tokens = await TokenService.generateAndStoreTokens(
        user,
        req.get('user-agent') || '',
        req.ip
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data and tokens
      return res.api.success({
        user: user.getPublicProfile(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // Refresh access token
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      // Verify the refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Find the token in the database and check if it's valid
      const tokenDoc = await TokenService.findToken(refreshToken);
      if (!tokenDoc || tokenDoc.isRevoked) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      // Get the user
      const user = await User.findById(decoded.userId);
      if (!user) {
        logger.error(`Refresh token attempt failed: User not found for ID ${decoded.userId}`);
        throw new ApiError(404, 'User not found');
      }

      // Generate new tokens
      const tokens = await TokenService.generateAndStoreTokens(
        user,
        req.get('user-agent') || '',
        req.ip
      );

      // Invalidate the old refresh token
      await TokenService.invalidateToken(refreshToken);

      // Return the new tokens
      return res.api.success({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Refresh token has expired'));
      } else if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid refresh token'));
      }
      
      next(new ApiError(401, error.message));
    }
  }

  // Logout (revoke refresh token)
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.api.badRequest('Refresh token is required');
      }

      await TokenService.revokeToken(refreshToken);
      
      return res.api.success(null, 'Successfully logged out');
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  static async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.userId).select('-password');
      
      if (!user) {
        logger.error(`User not found for ID ${req.user.userId}`);
        return res.api.notFound('User not found');
      }

      return res.api.success(user.getPublicProfile());
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      next(error);
    }
  }
}

module.exports = AuthController;
