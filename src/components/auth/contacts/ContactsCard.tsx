import React from 'react';
import { 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Globe, 
  Star,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  MessageSquare
} from 'lucide-react';
import type { Contact } from '../../types/contact.types';
import { formatDate } from '../../utils/dateUtils';

interface ContactCardProps {
  contact: Contact;
  groups: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onToggleStar: (contactId: string, starred: boolean) => void;
  className?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  groups,
  onEdit,
  onDelete,
  onToggleStar,
  className = ''
}) => {
  const handleDelete = () => {
    if (window.confirm('Er du sikker på at du vil slette denne kontakt?')) {
      onDelete(contact.id);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-lg font-medium">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{contact.name}</h3>
            {contact.title && (
              <p className="text-sm text-gray-500">{contact.title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleStar(contact.id, !contact.starred)}
            className={`p-1 rounded hover:bg-gray-100 ${
              contact.starred ? 'text-yellow-400' : 'text-gray-400'
            }`}
          >
            <Star className={`h-5 w-5 ${contact.starred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(contact)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {contact.email && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="h-4 w-4" />
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-blue-600"
            >
              {contact.email}
            </a>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Phone className="h-4 w-4" />
            <a
              href={`tel:${contact.phone}`}
              className="hover:text-blue-600"
            >
              {contact.phone}
            </a>
          </div>
        )}

        {contact.company && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Building className="h-4 w-4" />
            <span>{contact.company}</span>
          </div>
        )}

        {contact.address && (
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{contact.address}</span>
          </div>
        )}

        {contact.website && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Globe className="h-4 w-4" />
            <a
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              {contact.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {contact.groupIds && contact.groupIds.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {contact.groupIds.map(groupId => {
                const group = groups.find(g => g.id === groupId);
                if (!group) return null;
                return (
                  <span
                    key={group.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: `${group.color}20`,
                      color: group.color
                    }}
                  >
                    {group.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(contact.notes || contact.lastInteraction || contact.nextFollowUp) && (
        <div className="mt-4 pt-4 border-t">
          {contact.notes && (
            <div className="flex items-start space-x-2 text-gray-600">
              <MessageSquare className="h-4 w-4 mt-1" />
              <p className="text-sm">{contact.notes}</p>
            </div>
          )}

          {contact.lastInteraction && (
            <div className="flex items-center space-x-2 text-gray-600 mt-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Sidste kontakt: {formatDate(contact.lastInteraction)}
              </span>
            </div>
          )}

          {contact.nextFollowUp && (
            <div className="flex items-center space-x-2 text-gray-600 mt-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Næste opfølgning: {formatDate(contact.nextFollowUp)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactCard;