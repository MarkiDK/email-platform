import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Star,
  Mail,
  Phone,
  Building,
  Tag,
  MoreVertical,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { Contact, ContactGroup } from '../../types/contact.types';

const ContactsManager: React.FC = () => {
  const { 
    contacts,
    groups,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    addGroup,
    updateGroup,
    deleteGroup
  } = useContacts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'company'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    groupIds: [] as string[],
    notes: '',
    starred: false
  });

  // Group form state
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  useEffect(() => {
    if (editingContact) {
      setFormData({
        name: editingContact.name,
        email: editingContact.email,
        phone: editingContact.phone || '',
        company: editingContact.company || '',
        groupIds: editingContact.groupIds || [],
        notes: editingContact.notes || '',
        starred: editingContact.starred || false
      });
    }
  }, [editingContact]);

  useEffect(() => {
    if (editingGroup) {
      setGroupFormData({
        name: editingGroup.name,
        color: editingGroup.color,
        description: editingGroup.description || ''
      });
    }
  }, [editingGroup]);

  const filteredContacts = contacts
    .filter(contact => {
      const matchesSearch = 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGroup = 
        !selectedGroup || 
        contact.groupIds?.includes(selectedGroup);

      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'company':
          comparison = (a.company || '').localeCompare(b.company || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingContact) {
        await updateContact({
          ...editingContact,
          ...formData
        });
      } else {
        await addContact(formData);
      }

      setShowAddForm(false);
      setEditingContact(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        groupIds: [],
        notes: '',
        starred: false
      });
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGroup) {
        await updateGroup({
          ...editingGroup,
          ...groupFormData
        });
      } else {
        await addGroup(groupFormData);
      }

      setShowGroupForm(false);
      setEditingGroup(null);
      setGroupFormData({
        name: '',
        color: '#3B82F6',
        description: ''
      });
    } catch (err) {
      console.error('Failed to save group:', err);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne kontakt?')) {
      try {
        await deleteContact(contactId);
      } catch (err) {
        console.error('Failed to delete contact:', err);
      }
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne gruppe?')) {
      try {
        await deleteGroup(groupId);
        if (selectedGroup === groupId) {
          setSelectedGroup(null);
        }
      } catch (err) {
        console.error('Failed to delete group:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Der opstod en fejl ved indlæsning af kontakter
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar med grupper */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Grupper</h2>
          <button
            onClick={() => setShowGroupForm(true)}
            className="p-1 text-gray-600 hover:text-gray-900 rounded"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`
              w-full text-left px-3 py-2 rounded-lg
              ${!selectedGroup ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}
            `}
          >
            Alle kontakter
          </button>

          {groups.map(group => (
            <div
              key={group.id}
              className="flex items-center group"
            >
              <button
                onClick={() => setSelectedGroup(group.id)}
                className={`
                  flex-1 flex items-center px-3 py-2 rounded-lg
                  ${selectedGroup === group.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}
                `}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: group.color }}
                />
                <span>{group.name}</span>
              </button>
              <div className="hidden group-hover:flex items-center">
                <button
                  onClick={() => {
                    setEditingGroup(group);
                    setShowGroupForm(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hovedindhold */}
      <div className="flex-1 flex flex-col">
        {/* Værktøjslinje */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Søg efter kontakter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sortér efter:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'email' | 'company')}
                  className="border rounded-lg px-2 py-1"
                >
                  <option value="name">Navn</option>
                  <option value="email">Email</option>
                  <option value="company">Virksomhed</option>
                </select>
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <ChevronDown 
                    className={`h-5 w-5 transform transition-transform ${
                      sortDirection === 'desc' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingContact(null);
                  setShowAddForm(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="h-5 w-5" />
                <span>Ny kontakt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kontaktliste */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium">{contact.name}</h3>
                      {contact.starred && (
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${contact.email}`}
                          className="hover:text-blue-600"
                        >
                          {contact.email}
                        </a>
                      </div>

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

                      {contact.groupIds && contact.groupIds.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
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
                      )}
                    </div>

                    {contact.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        {contact.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setShowAddForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kontaktformular modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">