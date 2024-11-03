import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  Type,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Skriv din besked her...',
  className = '',
  minHeight = '200px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);

  const execCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value.toString());
    handleChange();
  };

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  };

  const handleLinkClick = () => {
    const text = getSelectedText();
    setSelectedText(text);
    setLinkText(text);
    setLinkUrl('');
    setIsLinkModalOpen(true);
  };

  const insertLink = () => {
    if (linkUrl) {
      const linkHtml = `<a href="${linkUrl}" target="_blank">${linkText || linkUrl}</a>`;
      execCommand('insertHTML', linkHtml);
    }
    setIsLinkModalOpen(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Her ville normalt være logik til at uploade billedet til en server
      // og få en URL tilbage. Dette er en simpel demo der laver en data URL.
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          execCommand('insertImage', e.target.result.toString());
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Fejl ved upload af billede:', error);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="rich-text-editor border rounded-lg">
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <button
          onClick={() => execCommand('undo')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Fortryd"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={() => execCommand('redo')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Gentag"
        >
          <Redo className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="h-8 border rounded text-sm"
        >
          <option value="p">Normal</option>
          <option value="h1">Overskrift 1</option>
          <option value="h2">Overskrift 2</option>
          <option value="h3">Overskrift 3</option>
          <option value="pre">Kode</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => execCommand('bold')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Fed"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => execCommand('italic')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Kursiv"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => execCommand('underline')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Understreget"
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => execCommand('justifyLeft')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Venstrejustér"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => execCommand('justifyCenter')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Centrér"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onClick={() => execCommand('justifyRight')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Højrejustér"
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Punktopstilling"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => execCommand('insertOrderedList')}
          className="p-1 hover:bg-gray-100 rounded"
          title="Nummereret liste"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={handleLinkClick}
          className="p-1 hover:bg-gray-100 rounded"
          title="Indsæt link"
        >
          <Link className="h-4 w-4" />
        </button>
        <label className="p-1 hover:bg-gray-100 rounded cursor-pointer" title="Indsæt billede">
          <Image className="h-4 w-4" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />
        </label>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={`p-3 focus:outline-none ${className}`}
        style={{ minHeight }}
        onInput={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
      />

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Indsæt link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tekst
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Annuller
                </button>
                <button
                  onClick={insertLink}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Indsæt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        [contenteditable=true]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;