import React from 'react';
import { 
  Inbox, 
  Send, 
  Star, 
  Archive, 
  Trash2, 
  Settings, 
  Shield, 
  Users, 
  Plus,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Tag
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useFolder } from '../../hooks/useFolder';
import { useLabel } from '../../hooks/useLabel';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { folders, createFolder } = useFolder();
  const { labels, createLabel } = useLabel();
  const [showFolders, setShowFolders] = React.useState(true);
  const [showLabels, setShowLabels] = React.useState(true);
  const [showNewFolderInput, setShowNewFolderInput] = React.useState(false);
  const [showNewLabelInput, setShowNewLabelInput] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [newLabelName, setNewLabelName] = React.useState('');

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await createFolder(newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabelName.trim()) {
      await createLabel(newLabelName);
      setNewLabelName('');
      setShowNewLabelInput(false);
    }
  };

  const mainMenuItems = [
    { path: '/inbox', icon: <Inbox />, label: 'Indbakke' },
    { path: '/sent', icon: <Send />, label: 'Sendt' },
    { path: '/starred', icon: <Star />, label: 'Stjernemarkeret' },
    { path: '/archive', icon: <Archive />, label: 'Arkiv' },
    { path: '/trash', icon: <Trash2 />, label: 'Papirkurv' }
  ];

  const bottomMenuItems = [
    { path: '/contacts', icon: <Users />, label: 'Kontakter' },
    { path: '/security', icon: <Shield />, label: 'Sikkerhed' },
    { path: '/settings', icon: <Settings />, label: 'Indstillinger' }
  ];

  return (
    <aside className={`
      bg-white border-r h-screen flex flex-col
      ${isCollapsed ? 'w-16' : 'w-64'}
      transition-width duration-200 ease-in-out
    `}>
      {/* Compose Button */}
      <div className="p-4">
        <NavLink
          to="/compose"
          className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {!isCollapsed && <span>Ny besked</span>}
        </NavLink>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {mainMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Folders Section */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between">
              {!isCollapsed && <span className="text-sm font-medium text-gray-500">Mapper</span>}
              <button 
                onClick={() => setShowFolders(!showFolders)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {showFolders ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {showFolders && (
            <ul className="space-y-1 px-2">
              {folders.map((folder) => (
                <li key={folder.id}>
                  <NavLink
                    to={`/folder/${folder.id}`}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {folder.icon || <FolderPlus className="h-5 w-5" />}
                    {!isCollapsed && <span>{folder.name}</span>}
                  </NavLink>
                </li>
              ))}
              
              {!isCollapsed && showNewFolderInput && (
                <li>
                  <form onSubmit={handleCreateFolder} className="px-3 py-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Mappenavn"
                      className="w-full px-2 py-1 text-sm border rounded"
                      autoFocus
                    />
                  </form>
                </li>
              )}

              {!isCollapsed && (
                <li>
                  <button
                    onClick={() => setShowNewFolderInput(true)}
                    className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Ny mappe</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Labels Section */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between">
              {!isCollapsed && <span className="text-sm font-medium text-gray-500">Labels</span>}
              <button 
                onClick={() => setShowLabels(!showLabels)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {showLabels ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {showLabels && (
            <ul className="space-y-1 px-2">
              {labels.map((label) => (
                <li key={label.id}>
                  <NavLink
                    to={`/label/${label.id}`}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Tag className="h-5 w-5" style={{ color: label.color }} />
                    {!isCollapsed && <span>{label.name}</span>}
                  </NavLink>
                </li>
              ))}
              
              {!isCollapsed && showNewLabelInput && (
                <li>
                  <form onSubmit={handleCreateLabel} className="px-3 py-2">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Labelnavn"
                      className="w-full px-2 py-1 text-sm border rounded"
                      autoFocus
                    />
                  </form>
                </li>
              )}

              {!isCollapsed && (
                <li>
                  <button
                    onClick={() => setShowNewLabelInput(true)}
                    className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Ny label</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </nav>

      {/* Bottom Menu */}
      <div className="border-t">
        <ul className="p-2 space-y-1">
          {bottomMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;