const User = require('../models/User');
const TokenService = require('../services/tokenService');
const { generateTokens } = require('../auth/jwt');
const ApiError = require('../utils/apiError');

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
      res.status(201).json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
          }
        }
      });
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
        console.log(`Login attempt failed: No user found with email ${email}`);
        throw new ApiError(401, 'Invalid email or password');
      }
      
      // Compare passwords
      const isMatch = await user.comparePassword(password);
      console.log(`Password match for user ${user._id}:`, isMatch);
      
      if (!isMatch) {
        console.log(`Login attempt failed: Incorrect password for user ${user._id}`);
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
      res.json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
          }
        }
      });
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

      const tokens = await TokenService.refreshAccessToken(
        refreshToken,
        req.get('user-agent') || '',
        req.ip
      );

      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout (revoke refresh token)
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      await TokenService.revokeToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  static async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data: user.getPublicProfile()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
