const { verifyAccessToken } = require('../auth/jwt');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify the access token
    const decoded = verifyAccessToken(token);
    
    // Attach user to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.message === 'Invalid access token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'TOKEN_EXPIRED_OR_INVALID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message
    });
  }
};

// Middleware to check user role
const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
