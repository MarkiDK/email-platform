import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Minus, 
  Maximize2,
  Minimize2,
  Paperclip,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Image,
  Trash2,
  Send
} from 'lucide-react';
import { useEmailCompose } from '../../hooks/useEmailCompose';
import { validateEmail } from '../../utils/validation';
import { formatFileSize } from '../../utils/fileUtils';
import type { Recipient, Attachment, DraftEmail } from '../../types/email.types';

interface ComposeEmailProps {
  initialData?: DraftEmail;
  onClose: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen: () => void;
  isMinimized?: boolean;
  onMinimize: () => void;
}

const ComposeEmail: React.FC<ComposeEmailProps> = ({
  initialData,
  onClose,
  isFullScreen,
  onToggleFullScreen,
  isMinimized,
  onMinimize
}) => {
  const navigate = useNavigate();
  const { sendEmail, saveDraft, uploadAttachment } = useEmailCompose();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [recipients, setRecipients] = useState<{
    to: Recipient[];
    cc: Recipient[];
    bcc: Recipient[];
  }>({
    to: initialData?.to || [],
    cc: initialData?.cc || [],
    bcc: initialData?.bcc || []
  });

  const [subject, setSubject] = useState(initialData?.subject || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save draft periodically
  useEffect(() => {
    const draftInterval = setInterval(() => {
      saveDraft({
        to: recipients.to,
        cc: recipients.cc,
        bcc: recipients.bcc,
        subject,
        content,
        attachments
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(draftInterval);
  }, [recipients, subject, content, attachments]);

  const handleRecipientsChange = (
    type: 'to' | 'cc' | 'bcc',
    value: string
  ) => {
    const emails = value.split(/[,;\s]+/).filter(Boolean);
    const validRecipients = emails.map(email => ({
      email: email.trim(),
      name: email.trim()
    })).filter(r => validateEmail(r.email));

    setRecipients(prev => ({
      ...prev,
      [type]: validRecipients
    }));
    setError(null);
  };

  const handleAttachmentUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        setError(`Filen "${file.name}" er for stor. Maksimal størrelse er 25MB.`);
        continue;
      }

      try {
        const attachment = await uploadAttachment(file);
        setAttachments(prev => [...prev, attachment]);
        setError(null);
      } catch (err) {
        setError('Kunne ikke uploade filen. Prøv igen senere.');
      }
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const handleFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const validateForm = (): boolean => {
    if (recipients.to.length === 0) {
      setError('Angiv mindst én modtager');
      return false;
    }

    if (!subject.trim()) {
      setError('Angiv et emne');
      return false;
    }

    if (!content.trim()) {
      setError('Skriv en besked');
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setSending(true);
    setError(null);

    try {
      await sendEmail({
        to: recipients.to,
        cc: recipients.cc,
        bcc: recipients.bcc,
        subject,
        content,
        attachments
      });

      onClose();
      navigate('/sent');
    } catch (err) {
      setError('Kunne ikke sende emailen. Prøv igen senere.');
      setSending(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-0 w-80 bg-white shadow-lg rounded-t-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium truncate">
            {subject || 'Ny email'}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onMinimize}
              className="text-gray-400 hover:text-gray-600"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      bg-white shadow-xl rounded-lg
      ${isFullScreen 
        ? 'fixed inset-0 z-50' 
        : 'fixed bottom-0 right-0 w-[600px] h-[600px]'}
    `}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">Ny email</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="text-gray-400 hover:text-gray-600"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleFullScreen}
            className="text-gray-400 hover:text-gray-600"
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-4">
          {/* Recipients */}
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Til"
                value={recipients.to.map(r => r.email).join(', ')}
                onChange={(e) => handleRecipientsChange('to', e.target.value)}
                className="flex-1 border-0 border-b focus:ring-0 focus:border-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCc(!showCc)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Cc
                </button>
                <button
                  onClick={() => setShowBcc(!showBcc)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Bcc
                </button>
              </div>
            </div>

            {showCc && (
              <input
                type="text"
                placeholder="Cc"
                value={recipients.cc.map(r => r.email).join(', ')}
                onChange={(e) => handleRecipientsChange('cc', e.target.value)}
                className="mt-2 w-full border-0 border-b focus:ring-0 focus:border-blue-500"
              />
            )}

            {showBcc && (
              <input
                type="text"
                placeholder="Bcc"
                value={recipients.bcc.map(r => r.email).join(', ')}
                onChange={(e) => handleRecipientsChange('bcc', e.target.value)}
                className="mt-2 w-full border-0 border-b focus:ring-0 focus:border-blue-500"
              />
            )}
          </div>

          {/* Subject */}
          <input
            type="text"
            placeholder="Emne"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border-0 border-b focus:ring-0 focus:border-blue-500"
          />

          {/* Formatting toolbar */}
          <div className="flex items-center space-x-2 border-b py-2">
            <button
              onClick={() => handleFormatting('bold')}
              className="p-1 text-gray-600 hover:text-gray-900 rounded"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleFormatting('italic')}
              className="p-1 text-gray-600 hover:text-gray-900 rounded"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const url = prompt('Indtast URL:');
                if (url) handleFormatting('createLink', url);
              }}
              className="p-1 text-gray-600 hover:text-gray-900 rounded"
            >
              <Link className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleFormatting('insertUnorderedList')}
              className="p-1 text-gray-600 hover:text-gray-900 rounded"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleFormatting('insertOrderedList')}
              className="p-1 text-gray-600 hover:text-gray-900 rounded"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const url = prompt('Indtast billede URL:');
                if (url) handleFormatting('insertImage', url);
              }}
              className="p-1 text-gray-600 hover:text-gray-900 rounded"
            >
              <Image className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div 
          ref={editorRef}
          contentEditable
          className="flex-1 p-4 overflow-auto focus:outline-none"
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="border-t p-4">
            <div className="grid grid-cols-2 gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Paperclip className="h-5 w-5" />
              <span>Vedhæft</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleAttachmentUpload(e.target.files)}
            />
          </div>

          <div className="flex items-center space-x-4">
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              onClick={handleSend}
              disabled={sending}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg text-white
                ${sending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              <Send className="h-5 w-5" />
              <span>{sending ? 'Sender...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeEmail;