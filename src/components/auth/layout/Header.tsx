import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  Bell, 
  HelpCircle, 
  User,
  LogOut,
  Settings,
  Mail,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { useSearch } from '../../hooks/useSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, markAsRead } = useNotification();
  const { searchQuery, setSearchQuery, searchResults } = useSearch();
  const [showSearchResults, setShowSearchResults] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center">
          <Mail className="h-6 w-6 text-blue-600" />
          <span className="ml-2 text-xl font-semibold">Mail</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Søg i emails..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
            {searchResults.length > 0 ? (
              <ul className="py-2">
                {searchResults.map((result) => (
                  <li
                    key={result.id}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      // Handle result click
                      setShowSearchResults(false);
                    }}
                  >
                    <div className="font-medium">{result.subject}</div>
                    <div className="text-sm text-gray-500">{result.snippet}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-2 text-gray-500">Ingen resultater fundet</div>
            )}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Help */}
        <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 px-1.5 min-w-[1.25rem] h-5"
                variant="destructive"
              >
                {unreadNotifications.length}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikationer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3"
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-500">{notification.message}</div>
                  {!notification.read && (
                    <Badge variant="secondary" className="mt-1">Ny</Badge>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Ingen notifikationer
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex flex-col">
              <span>{user?.name}</span>
              <span className="text-sm font-normal text-gray-500">
                {user?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Indstillinger</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log ud</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;