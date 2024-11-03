import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Schema } from 'joi';
import { ApiError } from '@/utils/ApiError';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationOptions = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      };

      const { error, value } = schema.validate(
        {
          body: req.body,
          query: req.query,
          params: req.params,
        },
        validationOptions
      );

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Validation error',
          validationErrors
        );
      }

      // Update req with validated values
      req.body = value.body;
      req.query = value.query;
      req.params = value.params;

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          message: error.message,
          errors: error.errors,
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Validation error occurred',
        });
      }
    }
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateFileSize = (fileSize: number, maxSize: number): boolean => {
  return fileSize <= maxSize;
};

export const validateFileType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimeType);
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
};

export const validateLanguageCode = (langCode: string): boolean => {
  const supportedLanguages = ['en', 'da', 'es', 'fr', 'de'];
  return supportedLanguages.includes(langCode);
};

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate;
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic international phone number validation
  const phoneRegex = /^\+?[\d\s-]{8,}$/;
  return phoneRegex.test(phone);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateImageDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): boolean => {
  return width <= maxWidth && height <= maxHeight;
};

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[^\w\s@.-]/g, '')
    .substring(0, 100);
};

export const validateObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

export const validatePageParams = (page: number, limit: number): boolean => {
  return (
    Number.isInteger(page) &&
    Number.isInteger(limit) &&
    page > 0 &&
    limit > 0 &&
    limit <= 100
  );
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 255);
};