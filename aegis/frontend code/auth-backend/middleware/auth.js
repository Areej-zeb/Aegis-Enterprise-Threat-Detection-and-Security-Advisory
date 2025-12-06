import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches decoded user info to req.user if valid
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      code: 'missing_token',
      message: 'Authentication token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      code: 'invalid_token',
      message: 'Your session is invalid or has expired. Please log in again.'
    });
  }
};
