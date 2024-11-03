import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@/models/user.model';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/services/email.service';
import { createAccessToken, createRefreshToken } from '@/utils/token.utils';
import { ApiError } from '@/utils/ApiError';
import { validateEmail, validatePassword } from '@/utils/validation.utils';
import { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN } from '@/config';

export class AuthController {
  /**
   * Register a new user
   */
  public static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'All fields are required');
      }

      if (!validateEmail(email)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email format');
      }

      if (!validatePassword(password)) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Password must be at least 8 characters long and contain at least one number, one uppercase and one lowercase letter'
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create verification token
      const verificationToken = jwt.sign(
        { email: email.toLowerCase() },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        verificationToken,
      });

      await user.save();

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      res.status(StatusCodes.CREATED).json({
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred during registration',
        });
      }
    }
  }

  /**
   * Login user
   */
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Email and password are required');
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
      }

      // Check if user is verified
      if (!user.isVerified) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Please verify your email first');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
      }

      // Generate tokens
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Set refresh token in cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: parseInt(REFRESH_TOKEN_EXPIRES_IN) * 1000,
      });

      res.status(StatusCodes.OK).json({
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred during login',
        });
      }
    }
  }

  /**
   * Verify email
   */
  public static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
      
      // Find and update user
      const user = await User.findOne({ 
        email: decoded.email,
        verificationToken: token 
      });

      if (!user) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired verification token');
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      res.status(StatusCodes.OK).json({
        message: 'Email verified successfully',
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid or expired verification token',
        });
      } else if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred during email verification',
        });
      }
    }
  }

  /**
   * Forgot password
   */
  public static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Email is required');
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Return success even if user not found for security
        return res.status(StatusCodes.OK).json({
          message: 'If an account exists with this email, you will receive a password reset link',
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // Send reset email
      await sendPasswordResetEmail(email, resetToken);

      res.status(StatusCodes.OK).json({
        message: 'If an account exists with this email, you will receive a password reset link',
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred while processing your request',
      });
    }
  }

  /**
   * Reset password
   */
  public static async resetPassword(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'New password is required');
      }

      if (!validatePassword(password)) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Password must be at least 8 characters long and contain at least one number, one uppercase and one lowercase letter'
        );
      }

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired reset token');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update user
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(StatusCodes.OK).json({
        message: 'Password reset successful',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while resetting password',
        });
      }
    }
  }

  /**
   * Refresh token
   */
  public static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token not found');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = createAccessToken(user);
      const newRefreshToken = createRefreshToken(user);

      // Update refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      // Set new refresh token in cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: parseInt(REFRESH_TOKEN_EXPIRES_IN) * 1000,
      });

      res.status(StatusCodes.OK).json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: 'Invalid refresh token',
        });
      } else if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while refreshing token',
        });
      }
    }
  }

  /**
   * Logout user
   */
  public static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
        // Find user and remove refresh token
        await User.findOneAndUpdate(
          { refreshToken },
          { $unset: { refreshToken: 1 } }
        );
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(StatusCodes.OK).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred during logout',
      });
    }
  }
}