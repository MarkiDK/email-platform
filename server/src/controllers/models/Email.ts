import { Schema, model, Document } from 'mongoose';
import { IEmail } from '@/interfaces/email.interface';
import { EmailFolder, EmailPriority, EmailStatus } from '@/types/email.types';

export interface IEmailDocument extends IEmail, Document {
  markAsRead(): Promise<void>;
  moveToFolder(folder: EmailFolder): Promise<void>;
  addLabel(label: string): Promise<void>;
  removeLabel(label: string): Promise<void>;
}

const emailSchema = new Schema<IEmailDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    from: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    to: [{
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    }],
    cc: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    bcc: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    htmlContent: {
      type: String,
    },
    attachments: [{
      filename: String,
      path: String,
      size: Number,
      mimeType: String,
    }],
    folder: {
      type: String,
      enum: Object.values(EmailFolder),
      default: EmailFolder.INBOX,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EmailStatus),
      default: EmailStatus.UNREAD,
    },
    priority: {
      type: String,
      enum: Object.values(EmailPriority),
      default: EmailPriority.NORMAL,
    },
    labels: [{
      type: String,
      trim: true,
    }],
    isStarred: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailThread',
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Email',
    },
    forwardedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Email',
    },
    scheduledFor: {
      type: Date,
    },
    draft: {
      type: Boolean,
      default: false,
    },
    lastSavedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailSchema.index({ userId: 1, folder: 1 });
emailSchema.index({ userId: 1, status: 1 });
emailSchema.index({ userId: 1, isStarred: 1 });
emailSchema.index({ userId: 1, labels: 1 });
emailSchema.index({ threadId: 1 });
emailSchema.index({ scheduledFor: 1 }, { sparse: true });
emailSchema.index(
  { subject: 'text', content: 'text' },
  { weights: { subject: 2, content: 1 } }
);

// Methods
emailSchema.methods.markAsRead = async function(): Promise<void> {
  if (this.status === EmailStatus.UNREAD) {
    this.status = EmailStatus.READ;
    this.readAt = new Date();
    await this.save();
  }
};

emailSchema.methods.moveToFolder = async function(folder: EmailFolder): Promise<void> {
  this.folder = folder;
  if (folder === EmailFolder.TRASH) {
    this.deletedAt = new Date();
    this.isDeleted = true;
  } else {
    this.deletedAt = undefined;
    this.isDeleted = false;
  }
  await this.save();
};

emailSchema.methods.addLabel = async function(label: string): Promise<void> {
  if (!this.labels.includes(label)) {
    this.labels.push(label);
    await this.save();
  }
};

emailSchema.methods.removeLabel = async function(label: string): Promise<void> {
  this.labels = this.labels.filter(l => l !== label);
  await this.save();
};

// Middleware
emailSchema.pre('save', function(next) {
  if (this.isModified('draft') && this.draft) {
    this.lastSavedAt = new Date();
  }
  next();
});

// Auto-delete emails in trash after 30 days
emailSchema.pre('save', function(next) {
  if (this.isModified('deletedAt') && this.deletedAt) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    // Schedule deletion
    setTimeout(async () => {
      try {
        await Email.deleteOne({ _id: this._id });
      } catch (error) {
        console.error('Failed to auto-delete email:', error);
      }
    }, thirtyDaysFromNow.getTime() - Date.now());
  }
  next();
});

export const Email = model<IEmailDocument>('Email', emailSchema);