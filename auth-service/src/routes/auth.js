const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { prisma } = require('../utils/database');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const { ValidationError, AuthenticationError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('role').optional().isIn(['EDUCATOR', 'STUDENT']),
  body('organizationId').optional().isInt()
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { email, password, firstName, lastName, role = 'EDUCATOR', organizationId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        organizationId: organizationId || null,
        emailVerificationToken
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your Acadex Mini account',
        template: 'email-verification',
        data: {
          name: firstName,
          verificationToken: emailVerificationToken
        }
      });
    } catch (emailError) {
      logger.warn('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    logger.info('User registered successfully:', { userId: user.id, email });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      requiresEmailVerification: true
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    logger.info('User logged in successfully:', { userId: user.id, email });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified
      },
      authorization: {
        token,
        refreshToken,
        expiresIn: '24h'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Invalidate refresh token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    logger.info('User logged out successfully');

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh', [
  body('refreshToken').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { refreshToken } = req.body;

    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Generate new access token
    const newToken = jwt.sign(
      { 
        userId: tokenRecord.user.id, 
        email: tokenRecord.user.email, 
        role: tokenRecord.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    
    // Update refresh token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json({
      message: 'Token refreshed successfully',
      authorization: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: '24h'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });

      // Send reset email
      try {
        await sendEmail({
          to: email,
          subject: 'Reset your Acadex Mini password',
          template: 'password-reset',
          data: {
            name: user.firstName,
            resetToken
          }
        });
      } catch (emailError) {
        logger.warn('Failed to send password reset email:', emailError);
      }
    }

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    logger.info('Password reset successfully:', { userId: user.id });

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify email
 * POST /api/auth/verify-email
 */
router.post('/verify-email', [
  body('token').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { token } = req.body;

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new AuthenticationError('Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null
      }
    });

    logger.info('Email verified successfully:', { userId: user.id });

    res.json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 