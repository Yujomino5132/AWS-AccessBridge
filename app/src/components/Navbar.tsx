import { useEffect, useState } from 'react';

interface NavbarProps {
  isSuperAdmin?: boolean;
  currentView?: 'accounts' | 'admin';
  setCurrentView?: (view: 'accounts' | 'admin') => void;
}

export default function Navbar({ isSuperAdmin = false, currentView = 'accounts', setCurrentView }: NavbarProps) {
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch('/api/user/me')
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Failed to fetch user data');
      })
      .then((data) => setEmail(data.email))
      .catch(() => {
        // Error handling is done at the App level
      });
  }, []);

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow">
      <div className="flex items-center space-x-6">
        <div className="text-xl font-bold">
          <span className="text-blue-400">AWS</span> AccessBridge
        </div>
        {isSuperAdmin && setCurrentView && (
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('accounts')}
              className={`px-3 py-1 rounded transition-colors ${
                currentView === 'accounts' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Accounts
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-3 py-1 rounded transition-colors ${
                currentView === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        )}
      </div>
      <div className="text-sm flex items-center gap-2">
        {isSuperAdmin && <span className="bg-yellow-600 px-2 py-1 rounded text-xs">ADMIN</span>}
        <span>{email}</span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 7l4.5 4 4.5-4H5.5z" />
        </svg>
      </div>
    </nav>
  );
}
