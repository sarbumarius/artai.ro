import React, { useState } from 'react';
import { Button } from './ui/Button';
import { HelpCircle, LogOut, User as UserIcon } from 'lucide-react';
import { InfoModal } from './InfoModal';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserOffcanvas from './UserOffcanvas';

export const Header: React.FC = () => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const initials = (user?.username || user?.email || '?')
    .split(/\s|\./)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <>
      <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🍌</div>
            <h1 className="text-xl font-semibold text-gray-100 hidden md:block">
              EDITOR - ARTai.ro
            </h1>
            <h1 className="text-xl font-semibold text-gray-100 md:hidden">
              NB Editor
            </h1>
          </div>
          <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
            1.0
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {user && (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex items-center space-x-2" onClick={() => setShowUser(true)}>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-semibold">
                  {initials}
                </span>
                <span className="text-sm text-gray-200 max-w-[160px] truncate">{user.username || user.email}</span>
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setShowUser(true)}>
                <UserIcon className="h-5 w-5" />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowInfoModal(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <InfoModal open={showInfoModal} onOpenChange={setShowInfoModal} />
      <UserOffcanvas open={showUser} onOpenChange={setShowUser} />
    </>
  );
};