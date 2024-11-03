import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Email } from '@/models/email.model';
import { User } from '@/models/user.model';
import { ApiError } from '@/utils/ApiError';
import { sendEmail } from '@/services/email.service';
import { validateEmail as isValidEmail } from '@/utils/validation.utils';
import { IUser } from '@/interfaces/user.interface';
import { EmailFolder } from '@/types/email.types';

export class EmailController {
  /**
   * Send a new email
   */
  public static async sendEmail(req: Request, res: Response) {
    try {
      const { to, subject, content, attachments } = req.body;
      const sender = req.user as IUser;

      // Validate recipients
      if (!to || !Array.isArray(to) || to.length === 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'At least one recipient is required');
      }

      // Validate each email address
      for (const recipient of to) {
        if (!isValidEmail(recipient)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid email address: ${recipient}`);
        }
      }

      // Validate subject and content
      if (!subject || !content) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Subject and content are required');
      }

      // Create email record
      const email = new Email({
        from: sender.email,
        to,
        subject,
        content,
        attachments: attachments || [],
        folder: EmailFolder.SENT,
        userId: sender._id,
      });

      await email.save();

      // Send email through email service
      await sendEmail({
        from: sender.email,
        to,
        subject,
        content,
        attachments,
      });

      res.status(StatusCodes.OK).json({
        message: 'Email sent successfully',
        email,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while sending the email',
        });
      }
    }
  }

  /**
   * Save email as draft
   */
  public static async saveDraft(req: Request, res: Response) {
    try {
      const { to, subject, content, attachments } = req.body;
      const user = req.user as IUser;

      // Validate recipients if provided
      if (to && Array.isArray(to)) {
        for (const recipient of to) {
          if (!isValidEmail(recipient)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid email address: ${recipient}`);
          }
        }
      }

      const draft = new Email({
        from: user.email,
        to: to || [],
        subject: subject || '',
        content: content || '',
        attachments: attachments || [],
        folder: EmailFolder.DRAFTS,
        userId: user._id,
      });

      await draft.save();

      res.status(StatusCodes.OK).json({
        message: 'Draft saved successfully',
        draft,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while saving the draft',
        });
      }
    }
  }

  /**
   * Get emails by folder
   */
  public static async getEmails(req: Request, res: Response) {
    try {
      const { folder } = req.params;
      const user = req.user as IUser;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Validate folder
      if (!Object.values(EmailFolder).includes(folder as EmailFolder)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid folder');
      }

      const skip = (page - 1) * limit;

      // Get emails
      const emails = await Email.find({
        userId: user._id,
        folder,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('attachments');

      // Get total count
      const total = await Email.countDocuments({
        userId: user._id,
        folder,
      });

      res.status(StatusCodes.OK).json({
        emails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while fetching emails',
        });
      }
    }
  }

  /**
   * Get single email by ID
   */
  public static async getEmail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      const email = await Email.findOne({
        _id: id,
        userId: user._id,
      }).populate('attachments');

      if (!email) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Email not found');
      }

      // Mark as read if unread
      if (!email.isRead) {
        email.isRead = true;
        await email.save();
      }

      res.status(StatusCodes.OK).json({ email });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while fetching the email',
        });
      }
    }
  }

  /**
   * Move email to trash
   */
  public static async moveToTrash(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      const email = await Email.findOne({
        _id: id,
        userId: user._id,
      });

      if (!email) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Email not found');
      }

      email.folder = EmailFolder.TRASH;
      await email.save();

      res.status(StatusCodes.OK).json({
        message: 'Email moved to trash',
        email,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while moving the email to trash',
        });
      }
    }
  }

  /**
   * Delete email permanently
   */
  public static async deleteEmail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      const email = await Email.findOneAndDelete({
        _id: id,
        userId: user._id,
        folder: EmailFolder.TRASH,
      });

      if (!email) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Email not found in trash');
      }

      res.status(StatusCodes.OK).json({
        message: 'Email deleted permanently',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while deleting the email',
        });
      }
    }
  }

  /**
   * Mark email as read/unread
   */
  public static async toggleRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isRead } = req.body;
      const user = req.user as IUser;

      if (typeof isRead !== 'boolean') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'isRead must be a boolean');
      }

      const email = await Email.findOne({
        _id: id,
        userId: user._id,
      });

      if (!email) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Email not found');
      }

      email.isRead = isRead;
      await email.save();

      res.status(StatusCodes.OK).json({
        message: `Email marked as ${isRead ? 'read' : 'unread'}`,
        email,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while updating the email',
        });
      }
    }
  }

  /**
   * Search emails
   */
  public static async searchEmails(req: Request, res: Response) {
    try {
      const { query } = req.query;
      const user = req.user as IUser;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Search query is required');
      }

      const skip = (page - 1) * limit;

      // Search emails
      const emails = await Email.find({
        userId: user._id,
        $or: [
          { subject: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { from: { $regex: query, $options: 'i' } },
          { to: { $regex: query, $options: 'i' } },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('attachments');

      // Get total count
      const total = await Email.countDocuments({
        userId: user._id,
        $or: [
          { subject: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { from: { $regex: query, $options: 'i' } },
          { to: { $regex: query, $options: 'i' } },
        ],
      });

      res.status(StatusCodes.OK).json({
        emails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while searching emails',
        });
      }
    }
  }
}