import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Password validation rules
const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long.')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter.')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number.');

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required.')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address.'),
    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
    passwordValidation
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        
        // Determine error code based on the error
        let code = 'validation_error';
        if (firstError.msg.includes('valid email')) {
          code = 'invalid_email';
        } else if (firstError.msg.includes('8 characters') || 
                   firstError.msg.includes('uppercase') || 
                   firstError.msg.includes('number')) {
          code = 'weak_password';
        }
        
        return res.status(400).json({
          success: false,
          code: code,
          message: firstError.msg
        });
      }

      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          code: 'email_in_use',
          message: 'This email is already registered. Try logging in instead.'
        });
      }

      // Hash password with 12 salt rounds
      const passwordHash = await bcrypt.hash(password, 12);

      // Create new user
      const user = new User({
        email,
        passwordHash
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post(
  '/login',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required.')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address.'),
    body('password')
      .notEmpty()
      .withMessage('Password is required.')
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          code: 'validation_error',
          message: 'Email and password are required.'
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'invalid_credentials',
          message: 'Invalid email or password.'
        });
      }

      // Compare password with hash
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          code: 'invalid_credentials',
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/me
 * Get current user info (protected route)
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
