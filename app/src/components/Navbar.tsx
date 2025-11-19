import { useEffect, useState } from 'react';

export default function Navbar() {
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
      <div className="text-xl font-bold">
        <span className="text-blue-400">AWS</span> AccessBridge
      </div>
      <div className="text-sm flex items-center gap-2">
        <span>{email}</span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 7l4.5 4 4.5-4H5.5z" />
        </svg>
      </div>
    </nav>
  );
}
