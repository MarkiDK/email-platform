import { Schema, model, Document } from 'mongoose';
import { IContact } from '@/interfaces/contact.interface';
import { ContactGroup } from '@/types/contact.types';

export interface IContactDocument extends IContact, Document {
  getFullName(): string;
  addToGroup(group: ContactGroup): Promise<void>;
  removeFromGroup(group: ContactGroup): Promise<void>;
}

const contactSchema = new Schema<IContactDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    groups: [{
      type: String,
      enum: Object.values(ContactGroup),
    }],
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    birthday: {
      type: Date,
    },
    avatar: {
      type: String,
    },
    socialMedia: {
      linkedin: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    lastcontacted: {
      type: Date,
    },
    customFields: [{
      label: {
        type: String,
        required: true,
        trim: true,
      },
      value: {
        type: String,
        required: true,
        trim: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
contactSchema.index({ userId: 1, email: 1 }, { unique: true });
contactSchema.index({ userId: 1, firstName: 1, lastName: 1 });
contactSchema.index({ userId: 1, groups: 1 });
contactSchema.index({ userId: 1, favorite: 1 });
contactSchema.index(
  { firstName: 'text', lastName: 'text', email: 'text', company: 'text' },
  { weights: { firstName: 3, lastName: 3, email: 2, company: 1 } }
);

// Virtual for full name
contactSchema.virtual('fullName').get(function (this: IContactDocument) {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Methods
contactSchema.methods.getFullName = function(): string {
  return this.fullName;
};

contactSchema.methods.addToGroup = async function(group: ContactGroup): Promise<void> {
  if (!this.groups.includes(group)) {
    this.groups.push(group);
    await this.save();
  }
};

contactSchema.methods.removeFromGroup = async function(group: ContactGroup): Promise<void> {
  this.groups = this.groups.filter(g => g !== group);
  await this.save();
};

// Middleware
contactSchema.pre('save', function(next) {
  // Update lastContacted if it's not set
  if (!this.lastContacted) {
    this.lastContacted = new Date();
  }
  next();
});

// Static methods
contactSchema.statics.findByGroup = function(userId: Schema.Types.ObjectId, group: ContactGroup) {
  return this.find({ userId, groups: group }).sort({ firstName: 1, lastName: 1 });
};

contactSchema.statics.findFavorites = function(userId: Schema.Types.ObjectId) {
  return this.find({ userId, favorite: true }).sort({ firstName: 1, lastName: 1 });
};

contactSchema.statics.searchContacts = function(
  userId: Schema.Types.ObjectId,
  searchTerm: string
) {
  return this.find({
    userId,
    $text: { $search: searchTerm },
  })
    .sort({ score: { $meta: 'textScore' } })
    .select('-__v');
};

export const Contact = model<IContactDocument>('Contact', contactSchema);