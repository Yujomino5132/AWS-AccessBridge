import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AccountList from '../components/AccountList';
import AdminPage from '../components/AdminPage';
import CostDashboard from '../components/CostDashboard';
import ResourceInventory from '../components/ResourceInventory';
import Unauthorized from '../components/Unauthorized';

type View = 'accounts' | 'costs' | 'resources' | 'admin';

export default function SpaApp() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [currentView, setCurrentView] = useState<View>('accounts');
  const [showHidden, setShowHidden] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('aws-access-bridge-page-size');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('aws-access-bridge-current-page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalAccounts, setTotalAccounts] = useState(0);

  const handleSetTotalAccounts = useCallback((count: number) => {
    setTotalAccounts(count);
  }, []);

  useEffect(() => {
    localStorage.setItem('aws-access-bridge-page-size', pageSize.toString());
  }, [pageSize]);

  useEffect(() => {
    sessionStorage.setItem('aws-access-bridge-current-page', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.status === 401) {
          setIsAuthorized(false);
        } else if (response.ok) {
          const userData = (await response.json()) as { isSuperAdmin?: boolean; email?: string; demoMode?: boolean };
          setIsAuthorized(true);
          setIsSuperAdmin(userData.isSuperAdmin || false);
          setIsDemoMode(userData.demoMode || false);
          setUserEmail(userData.email || '');
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterOpen && !(event.target as Element).closest('.filter-dropdown')) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  if (isAuthorized === null) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Unauthorized />;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {isDemoMode && (
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-center py-2 font-semibold text-sm sticky top-0 z-50 shadow-md">
          Demo Mode — Data shown is for demonstration purposes only. Admin operations are disabled.
        </div>
      )}
      <SpaNavbar isSuperAdmin={isSuperAdmin} currentView={currentView} setCurrentView={setCurrentView} userEmail={userEmail} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div key={currentView} className="animate-fade-in-up">
          {currentView === 'admin' && isSuperAdmin ? (
            <AdminPage />
          ) : currentView === 'costs' ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-100">Cost Analytics</h2>
              <CostDashboard />
            </div>
          ) : currentView === 'resources' ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-100">Resource Inventory</h2>
              <ResourceInventory />
            </div>
          ) : (
            <>
              <div className="flex items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold flex-shrink-0 text-gray-100">AWS Accounts</h2>
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by account id or nickname"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-white placeholder-gray-500 focus:outline-none"
                    style={{
                      paddingLeft: '40px',
                      paddingRight: '16px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      background: '#1e2433',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div className="relative filter-dropdown flex-shrink-0">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
                    style={{ padding: '10px 12px', background: '#1e2433', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Filters
                  </button>
                  {filterOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 shadow-xl z-10 animate-slide-down"
                      style={{ background: '#1e2433', borderRadius: '8px' }}
                    >
                      <div className="p-3">
                        <label className="flex items-center cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={showHidden}
                            onChange={(e) => {
                              setShowHidden(e.target.checked);
                              setCurrentPage(1);
                            }}
                            className="mr-2.5 rounded"
                          />
                          Include Hidden
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                {!searchTerm.trim() && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400">Per page:</label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="text-white text-sm focus:outline-none"
                        style={{ padding: '6px 8px', background: '#252d3d', borderRadius: '6px', border: 'none' }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    {totalAccounts > 0 && (
                      <>
                        <div className="text-sm text-gray-500">
                          {Math.min((currentPage - 1) * pageSize + 1, totalAccounts)}&ndash;
                          {Math.min(currentPage * pageSize, totalAccounts)} of {totalAccounts}
                        </div>
                        {Math.ceil(totalAccounts / pageSize) > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{
                                padding: '6px 10px',
                                background: '#252d3d',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: currentPage === 1 ? 'default' : 'pointer',
                              }}
                            >
                              Prev
                            </button>
                            {Array.from({ length: Math.min(5, Math.ceil(totalAccounts / pageSize)) }, (_, i) => {
                              const totalPages = Math.ceil(totalAccounts / pageSize);
                              let pageNum;
                              if (totalPages <= 5) pageNum = i + 1;
                              else if (currentPage <= 3) pageNum = i + 1;
                              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                              else pageNum = currentPage - 2 + i;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="text-sm"
                                  style={{
                                    padding: '6px 12px',
                                    background: currentPage === pageNum ? '#2563eb' : '#252d3d',
                                    color: currentPage === pageNum ? '#fff' : '#d1d5db',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil(totalAccounts / pageSize), currentPage + 1))}
                              disabled={currentPage === Math.ceil(totalAccounts / pageSize)}
                              className="text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{
                                padding: '6px 10px',
                                background: '#252d3d',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: currentPage === Math.ceil(totalAccounts / pageSize) ? 'default' : 'pointer',
                              }}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <AccountList
                showHidden={showHidden}
                searchTerm={searchTerm}
                pageSize={pageSize}
                currentPage={currentPage}
                setTotalAccounts={handleSetTotalAccounts}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SpaNavbar({
  isSuperAdmin,
  currentView,
  setCurrentView,
  userEmail,
}: {
  isSuperAdmin: boolean;
  currentView: View;
  setCurrentView: (view: View) => void;
  userEmail: string;
}) {
  return (
    <nav
      className="text-white flex justify-between items-center"
      style={{
        padding: '12px 24px',
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1e2433',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div className="flex items-center gap-8">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-blue-400">AWS</span> AccessBridge
        </div>
        <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setCurrentView('accounts')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'accounts' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            Accounts
          </button>
          <button
            onClick={() => setCurrentView('costs')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'costs' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            Costs
          </button>
          <button
            onClick={() => setCurrentView('resources')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'resources' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            Resources
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'admin' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
            >
              Admin
            </button>
          )}
        </div>
      </div>
      <div className="text-sm flex items-center gap-3">
        {isSuperAdmin && (
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-xs font-medium">
            ADMIN
          </span>
        )}
        <span className="text-gray-400">{userEmail}</span>
      </div>
    </nav>
  );
}
