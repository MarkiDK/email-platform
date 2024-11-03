import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Trash2, 
  Archive, 
  MoreVertical, 
  Mail, 
  AlertCircle,
  Search,
  Filter,
  RefreshCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useEmails } from '../../hooks/useEmails';
import { formatDate } from '../../utils/dateUtils';
import { truncateText } from '../../utils/stringUtils';
import type { Email } from '../../types/email.types';

const EmailList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    emails, 
    loading, 
    error, 
    fetchEmails, 
    markAsStarred, 
    deleteEmail, 
    archiveEmail 
  } = useEmails();

  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unread' | 'starred'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'sender'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchEmails();
  }, []);

  // Filtrering af emails
  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.preview.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterBy === 'all' ? true :
      filterBy === 'unread' ? !email.read :
      filterBy === 'starred' ? email.starred :
      true;

    return matchesSearch && matchesFilter;
  });

  // Sortering af emails
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return a.sender.name.localeCompare(b.sender.name);
    }
  });

  // Paginering
  const indexOfLastEmail = currentPage * itemsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - itemsPerPage;
  const currentEmails = sortedEmails.slice(indexOfFirstEmail, indexOfLastEmail);
  const totalPages = Math.ceil(sortedEmails.length / itemsPerPage);

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === currentEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(currentEmails.map(email => email.id));
    }
  };

  const handleBulkAction = async (action: 'delete' | 'archive' | 'star') => {
    try {
      for (const emailId of selectedEmails) {
        switch (action) {
          case 'delete':
            await deleteEmail(emailId);
            break;
          case 'archive':
            await archiveEmail(emailId);
            break;
          case 'star':
            await markAsStarred(emailId);
            break;
        }
      }
      setSelectedEmails([]);
      fetchEmails();
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  const renderEmailRow = (email: Email) => {
    const isSelected = selectedEmails.includes(email.id);

    return (
      <div 
        key={email.id}
        className={`
          flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer
          ${isSelected ? 'bg-blue-50' : ''}
          ${!email.read ? 'font-semibold bg-white' : 'font-normal'}
        `}
        onClick={() => navigate(`/email/${email.id}`)}
      >
        <div className="flex items-center space-x-4 w-full">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleSelectEmail(email.id);
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsStarred(email.id);
            }}
            className={`hover:text-yellow-500 ${email.starred ? 'text-yellow-400' : 'text-gray-400'}`}
          >
            <Star className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm truncate">
                {email.sender.name} <span className="text-gray-500">&lt;{email.sender.email}&gt;</span>
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(email.date)}
              </p>
            </div>
            
            <p className="text-sm font-medium truncate mt-1">
              {email.subject}
            </p>
            
            <p className="text-sm text-gray-600 truncate mt-1">
              {truncateText(email.preview, 120)}
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {email.attachments && email.attachments.length > 0 && (
              <span className="text-gray-400">
                <Mail className="h-5 w-5" />
              </span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                archiveEmail(email.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Archive className="h-5 w-5" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteEmail(email.id);
              }}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Implementer mere-menu her
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Der opstod en fejl</h3>
          <p className="text-gray-500 mt-2">Kunne ikke hente dine emails. Prøv igen senere.</p>
          <button
            onClick={() => fetchEmails()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Prøv igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedEmails.length === currentEmails.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            
            {selectedEmails.length > 0 ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('star')}
                  className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg"
                >
                  <Star className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <Archive className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchEmails()}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <RefreshCcw className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søg i emails..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'unread' | 'starred')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle</option>
              <option value="unread">Ulæste</option>
              <option value="starred">Markerede</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'sender')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Dato</option>
              <option value="sender">Afsender</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : currentEmails.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Ingen emails fundet</h3>
              <p className="text-gray-500 mt-2">
                {searchQuery 
                  ? 'Prøv at ændre din søgning'
                  : 'Din indbakke er tom'
                }
              </p>
            </div>
          </div>
        ) : (
          currentEmails.map(renderEmailRow)
        )}
      </div>

      {/* Pagination */}
      {!loading && currentEmails.length > 0 && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Viser {indexOfFirstEmail + 1}-{Math.min(indexOfLastEmail, sortedEmails.length)} af {sortedEmails.length} emails
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <span className="text-sm text-gray-700">
                Side {currentPage} af {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailList;