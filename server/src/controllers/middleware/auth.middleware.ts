import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { User } from '@/models/user.model';
import { ApiError } from '@/utils/ApiError';
import { config } from '@/config';
import { IUser } from '@/interfaces/user.interface';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check if user exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Account is suspended or deleted'
      );
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Invalid token',
      });
    } else if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Authentication error',
      });
    }
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Authentication required'
        );
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          'You do not have permission to perform this action'
        );
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Authorization error',
        });
      }
    }
  };
};

export const verifiedMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as IUser;
    
    if (!user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Authentication required'
      );
    }

    if (!user.isVerified) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Email verification required'
      );
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Verification check error',
      });
    }
  }
};

export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Refresh token is required'
      );
    }

    // Find user by refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid refresh token'
      );
    }

    // Verify refresh token
    jwt.verify(refreshToken, config.jwt.refreshSecret);

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Invalid refresh token',
      });
    } else if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Refresh token error',
      });
    }
  }
};