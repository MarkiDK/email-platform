import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { validateEmail, validatePhone } from '../../utils/validation';
import type { Contact } from '../../types/contact.types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id'>) => Promise<void>;
  initialData?: Contact;
  groups: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  groups
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    address: '',
    website: '',
    notes: '',
    groupIds: [] as string[],
    starred: false,
    lastInteraction: '',
    nextFollowUp: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || '',
        company: initialData.company || '',
        title: initialData.title || '',
        address: initialData.address || '',
        website: initialData.website || '',
        notes: initialData.notes || '',
        groupIds: initialData.groupIds || [],
        starred: initialData.starred || false,
        lastInteraction: initialData.lastInteraction || '',
        nextFollowUp: initialData.nextFollowUp || ''
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Navn er påkrævet';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email er påkrævet';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Ugyldig email adresse';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Ugyldigt telefonnummer';
    }

    if (formData.website && !formData.website.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)) {
      newErrors.website = 'Ugyldig website adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Fejl ved gemning af kontakt:', error);
      setErrors({
        submit: 'Der opstod en fejl ved gemning af kontakten. Prøv igen.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Fjern fejl når brugeren begynder at rette
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Rediger kontakt' : 'Tilføj ny kontakt'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basis information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Navn *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Indtast navn"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Indtast email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Indtast telefonnummer"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Indtast firma"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Indtast titel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.website ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Indtast website"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-500">{errors.website}</p>
                )}
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Indtast adresse"
            />
          </div>

          {/* Grupper */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grupper
            </label>
            <div className="flex flex-wrap gap-2">
              {groups.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleGroupToggle(group.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${
                      formData.groupIds.includes(group.id)
                        ? `bg-${group.color} text-white`
                        : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                    }
                  `}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          {/* Datoer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sidste kontakt
              </label>
              <input
                type="date"
                name="lastInteraction"
                value={formData.lastInteraction}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Næste opfølgning
              </label>
              <input
                type="date"
                name="nextFollowUp"
                value={formData.nextFollowUp}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Noter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Noter
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tilføj noter om kontakten..."
            />
          </div>

          {/* Stjerne */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, starred: !prev.starred }))}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                formData.starred
                  ? 'text-yellow-500 bg-yellow-50'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Star className={`h-5 w-5 ${formData.starred ? 'fill-current' : ''}`} />
              <span>Marker som favorit</span>
            </button>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          {/* Knapper */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? 'Gemmer...' : initialData ? 'Gem ændringer' : 'Tilføj kontakt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;