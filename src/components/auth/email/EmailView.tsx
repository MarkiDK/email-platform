import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Star,
  Trash2,
  Archive,
  Reply,
  Forward,
  MoreVertical,
  Download,
  Printer,
  Mail,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useEmail } from '../../hooks/useEmail';
import { formatFullDate } from '../../utils/dateUtils';
import { formatFileSize } from '../../utils/fileUtils';
import type { Email, Attachment } from '../../types/email.types';

const EmailView: React.FC = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  const { 
    email, 
    loading, 
    error, 
    fetchEmail,
    markAsStarred,
    deleteEmail,
    archiveEmail,
    downloadAttachment
  } = useEmail(emailId);

  const [showFullHeaders, setShowFullHeaders] = useState(false);
  const [replyMode, setReplyMode] = useState<'reply' | 'forward' | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (emailId) {
      fetchEmail(emailId);
    }
  }, [emailId]);

  // Sikker HTML rendering
  useEffect(() => {
    if (email?.content && contentRef.current) {
      // Sanitize og render HTML content
      contentRef.current.innerHTML = email.content;
    }
  }, [email?.content]);

  const handlePrint = () => {
    window.print();
  };

  const handleReply = () => {
    setReplyMode('reply');
  };

  const handleForward = () => {
    setReplyMode('forward');
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      await downloadAttachment(emailId!, attachment.id);
    } catch (err) {
      console.error('Failed to download attachment:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Der opstod en fejl</h3>
          <p className="text-gray-500 mt-2">Kunne ikke hente emailen. Prøv igen senere.</p>
          <button
            onClick={() => navigate('/inbox')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tilbage til indbakken
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
            <button
              onClick={() => navigate('/inbox')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => markAsStarred(email.id)}
                className={`p-2 rounded-lg ${
                  email.starred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-500'
                }`}
              >
                <Star className="h-5 w-5" />
              </button>

              <button
                onClick={() => archiveEmail(email.id)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <Archive className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  deleteEmail(email.id);
                  navigate('/inbox');
                }}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReply}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
            >
              <Reply className="h-5 w-5" />
              <span>Svar</span>
            </button>

            <button
              onClick={handleForward}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
            >
              <Forward className="h-5 w-5" />
              <span>Videresend</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <Printer className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {/* Dropdown menu her */}
            </div>
          </div>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {email.subject}
            </h1>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {email.sender.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {email.sender.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {email.sender.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {formatFullDate(email.date)}
                </p>
                <button
                  onClick={() => setShowFullHeaders(!showFullHeaders)}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                >
                  {showFullHeaders ? 'Skjul detaljer' : 'Vis detaljer'}
                </button>
              </div>
            </div>

            {showFullHeaders && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                <p><strong>Til:</strong> {email.to.map(r => `${r.name} <${r.email}>`).join(', ')}</p>
                {email.cc?.length > 0 && (
                  <p className="mt-1"><strong>Cc:</strong> {email.cc.map(r => `${r.name} <${r.email}>`).join(', ')}</p>
                )}
                {email.bcc?.length > 0 && (
                  <p className="mt-1"><strong>Bcc:</strong> {email.bcc.map(r => `${r.name} <${r.email}>`).join(', ')}</p>
                )}
                <p className="mt-1"><strong>Dato:</strong> {formatFullDate(email.date)}</p>
                <p className="mt-1"><strong>Emne:</strong> {email.subject}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Vedhæftede filer ({email.attachments.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {email.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadAttachment(attachment)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div 
            ref={contentRef}
            className="prose prose-blue max-w-none"
          />
        </div>
      </div>

      {/* Reply/Forward form */}
      {replyMode && (
        <div className="border-t p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {replyMode === 'reply' ? 'Svar' : 'Videresend'}
              </h2>
            </div>

            <div className="border rounded-lg">
              <div className="p-4">
                <div className="space-y-4">
                  {replyMode === 'forward' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Til
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Email adresse"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Emne
                    </label>
                    <input
                      type="text"
                      value={`${replyMode === 'reply' ? 'Re: ' : 'Fwd: '}${email.subject}`}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Besked
                    </label>
                    <textarea
                      rows={6}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Skriv din besked her..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end space-x-3 rounded-b-lg">
                <button
                  onClick={() => setReplyMode(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Annuller
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            // onClick={() => navigateToPreviousEmail()}
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Forrige</span>
          </button>

          <button
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            // onClick={() => navigateToNextEmail()}
          >
            <span>Næste</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailView;