import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Contact } from '@/models/contact.model';
import { ApiError } from '@/utils/ApiError';
import { validateEmail } from '@/utils/validation.utils';
import { IUser } from '@/interfaces/user.interface';
import { ContactGroup } from '@/types/contact.types';

export class ContactController {
  /**
   * Create a new contact
   */
  public static async createContact(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, phone, company, groups, notes } = req.body;
      const user = req.user as IUser;

      // Validate required fields
      if (!firstName || !email) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'First name and email are required');
      }

      // Validate email format
      if (!validateEmail(email)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email format');
      }

      // Check if contact already exists for this user
      const existingContact = await Contact.findOne({
        userId: user._id,
        email: email.toLowerCase(),
      });

      if (existingContact) {
        throw new ApiError(StatusCodes.CONFLICT, 'Contact with this email already exists');
      }

      // Create contact
      const contact = new Contact({
        userId: user._id,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        company,
        groups: groups || [],
        notes,
      });

      await contact.save();

      res.status(StatusCodes.CREATED).json({
        message: 'Contact created successfully',
        contact,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while creating the contact',
        });
      }
    }
  }

  /**
   * Get all contacts for user
   */
  public static async getContacts(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const group = req.query.group as ContactGroup;

      const skip = (page - 1) * limit;

      // Build query
      const query: any = { userId: user._id };
      if (group) {
        query.groups = group;
      }

      // Get contacts
      const contacts = await Contact.find(query)
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const total = await Contact.countDocuments(query);

      res.status(StatusCodes.OK).json({
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred while fetching contacts',
      });
    }
  }

  /**
   * Get single contact by ID
   */
  public static async getContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      const contact = await Contact.findOne({
        _id: id,
        userId: user._id,
      });

      if (!contact) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Contact not found');
      }

      res.status(StatusCodes.OK).json({ contact });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while fetching the contact',
        });
      }
    }
  }

  /**
   * Update contact
   */
  public static async updateContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone, company, groups, notes } = req.body;
      const user = req.user as IUser;

      // Validate email if provided
      if (email && !validateEmail(email)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email format');
      }

      // Check if contact exists
      const contact = await Contact.findOne({
        _id: id,
        userId: user._id,
      });

      if (!contact) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Contact not found');
      }

      // Check if email is being changed and new email already exists
      if (email && email.toLowerCase() !== contact.email) {
        const existingContact = await Contact.findOne({
          userId: user._id,
          email: email.toLowerCase(),
          _id: { $ne: id },
        });

        if (existingContact) {
          throw new ApiError(StatusCodes.CONFLICT, 'Contact with this email already exists');
        }
      }

      // Update contact
      const updatedContact = await Contact.findByIdAndUpdate(
        id,
        {
          firstName: firstName || contact.firstName,
          lastName: lastName || contact.lastName,
          email: email ? email.toLowerCase() : contact.email,
          phone: phone || contact.phone,
          company: company || contact.company,
          groups: groups || contact.groups,
          notes: notes || contact.notes,
        },
        { new: true }
      );

      res.status(StatusCodes.OK).json({
        message: 'Contact updated successfully',
        contact: updatedContact,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while updating the contact',
        });
      }
    }
  }

  /**
   * Delete contact
   */
  public static async deleteContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      const contact = await Contact.findOneAndDelete({
        _id: id,
        userId: user._id,
      });

      if (!contact) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Contact not found');
      }

      res.status(StatusCodes.OK).json({
        message: 'Contact deleted successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while deleting the contact',
        });
      }
    }
  }

  /**
   * Search contacts
   */
  public static async searchContacts(req: Request, res: Response) {
    try {
      const { query } = req.query;
      const user = req.user as IUser;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!query) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Search query is required');
      }

      const skip = (page - 1) * limit;

      // Search contacts
      const contacts = await Contact.find({
        userId: user._id,
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
        ],
      })
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const total = await Contact.countDocuments({
        userId: user._id,
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
        ],
      });

      res.status(StatusCodes.OK).json({
        contacts,
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
          message: 'An error occurred while searching contacts',
        });
      }
    }
  }

  /**
   * Get contact groups
   */
  public static async getContactGroups(req: Request, res: Response) {
    try {
      const user = req.user as IUser;

      // Get unique groups from user's contacts
      const groups = await Contact.distinct('groups', { userId: user._id });

      res.status(StatusCodes.OK).json({ groups });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred while fetching contact groups',
      });
    }
  }
}