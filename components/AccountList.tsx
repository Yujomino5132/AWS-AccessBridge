'use client';

import { useState, useEffect, useCallback } from 'react';
import AccessKeyModal from './AccessKeyModal';

type RoleMap = Record<string, { roles: string[]; nickname?: string; favorite: boolean }>;

interface AccountListProps {
  showHidden: boolean;
  searchTerm: string;
  pageSize: number;
  currentPage: number;
  setTotalAccounts: (count: number) => void;
}

export default function AccountList({ showHidden, searchTerm, pageSize, currentPage, setTotalAccounts }: AccountListProps) {
  const [rolesData, setRolesData] = useState<RoleMap>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalData, setModalData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<string | null>(null);
  const [loadingConsole, setLoadingConsole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);

    let url: string;
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set('q', searchTerm.trim());
      if (showHidden) params.set('showHidden', 'true');
      url = `/api/user/assumables/search?${params.toString()}`;
    } else {
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams();
      if (showHidden) params.set('showHidden', 'true');
      params.set('limit', pageSize.toString());
      params.set('offset', offset.toString());
      url = `/api/user/assumables?${params.toString()}`;
    }

    try {
      const res = await fetch(url);
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as { Exception?: { Message?: string } } | null;
        const errorMsg = errorData?.Exception?.Message || `Failed to load accounts: ${res.status} ${res.statusText}`;
        throw new Error(errorMsg);
      }

      const data = (await res.json()) as RoleMap & { totalAccounts?: number };
      if (data) {
        if (searchTerm.trim()) {
          setRolesData(data);
          setTotalAccounts(Object.keys(data).length);
        } else {
          const { totalAccounts: total, ...accounts } = data;
          setRolesData(accounts);
          setTotalAccounts(total ?? 0);
        }
        setExpanded(Object.fromEntries(Object.keys(searchTerm.trim() ? data : data).map((id) => [id, false])));
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AWS accounts');
    } finally {
      setIsLoading(false);
    }
  }, [showHidden, currentPage, pageSize, searchTerm, setTotalAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFavorite = async (accountId: string) => {
    const isFavorite = rolesData[accountId]?.favorite;

    try {
      const response = await fetch('/api/user/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awsAccountId: accountId }),
      });

      if (response.status === 401) {
        window.location.reload();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to ${isFavorite ? 'unfavorite' : 'favorite'} account`);
      }

      setRolesData((prev) => ({
        ...prev,
        [accountId]: {
          ...prev[accountId],
          favorite: !isFavorite,
        },
      }));
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleAccessKeys = async (accountId: string, role: string) => {
    const principalArn = `arn:aws:iam::${accountId}:role/${role}`;
    const loadingKey = `${accountId}-${role}`;

    setLoadingKeys(loadingKey);
    try {
      const assumeRes = await fetch('/api/aws/assume-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principalArn }),
      });

      if (assumeRes.status === 401) {
        window.location.reload();
        return;
      }

      if (!assumeRes.ok) {
        const errorText = await assumeRes.text();
        throw new Error(`Assume role failed: ${assumeRes.status} ${errorText}`);
      }

      const creds = await assumeRes.json();
      setModalData(creds);
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoadingKeys(null);
    }
  };

  const handleConsole = async (accountId: string, role: string) => {
    const loadingKey = `${accountId}-${role}`;
    setLoadingConsole(loadingKey);
    try {
      const federateUrl = `/federate?awsAccountId=${accountId}&role=${encodeURIComponent(role)}`;
      window.open(federateUrl, '_blank');
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoadingConsole(null);
    }
  };

  return (
    <div>
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Accounts...</p>
        </div>
      )}
      {!isLoading && error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      {!error && Object.keys(rolesData).length === 0 && !isLoading && (
        <div className="bg-gray-800 border border-gray-700/50 p-12 rounded-xl text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-lg text-gray-300 mb-2">No AWS accounts available</p>
          <p className="text-sm text-gray-500">You don't have access to any AWS accounts. Contact your administrator to request access.</p>
        </div>
      )}
      {!isLoading &&
        Object.entries(rolesData).map(([accountId, accountData]) => (
          <div
            key={accountId}
            className="bg-gray-800 border border-gray-700/50 rounded-xl p-4 my-3 text-white animate-fade-in-up hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center cursor-pointer group flex-1" onClick={() => toggleExpand(accountId)}>
                <svg
                  width="14"
                  height="14"
                  className={`shrink-0 mr-3 text-gray-500 group-hover:text-gray-300 transition-all duration-200 ${expanded[accountId] ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <div className="text-base font-semibold">
                  {accountData.nickname ? (
                    <>
                      <span className="text-gray-100">{accountData.nickname}</span>{' '}
                      <span className="text-gray-500 font-normal text-sm ml-1">{accountId}</span>
                    </>
                  ) : (
                    <span className="font-mono text-gray-200">{accountId}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(accountId)}
                className="text-xl hover:scale-110 transition-transform ml-4"
                title={accountData.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {accountData.favorite ? '⭐' : '☆'}
              </button>
            </div>
            <div
              className="overflow-hidden transition-all duration-200 ease-out"
              style={{
                maxHeight: expanded[accountId] ? `${accountData.roles.length * 44 + 16}px` : '0px',
                opacity: expanded[accountId] ? 1 : 0,
              }}
            >
              <div className="ml-7 mt-3 space-y-1">
                {accountData.roles.map((role) => {
                  const loadingKey = `${accountId}-${role}`;
                  const isLoadingKeys = loadingKeys === loadingKey;
                  const isLoadingConsole = loadingConsole === loadingKey;

                  return (
                    <div
                      key={role}
                      className="flex justify-between items-center py-1.5 px-3 rounded-lg hover:bg-gray-750 transition-colors group/role"
                    >
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isLoadingConsole) handleConsole(accountId, role);
                        }}
                        className={`transition-colors ${
                          isLoadingConsole ? 'text-gray-400 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'
                        }`}
                      >
                        {isLoadingConsole ? 'Opening Console...' : role}
                      </a>
                      <button
                        className={`text-sm transition-all ${isLoadingKeys ? 'text-gray-400' : 'text-gray-500 group-hover/role:text-blue-400 hover:text-blue-300'}`}
                        onClick={() => handleAccessKeys(accountId, role)}
                        disabled={isLoadingKeys}
                      >
                        {isLoadingKeys ? 'Loading...' : 'Access Keys'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

      {modalData && <AccessKeyModal {...modalData} onClose={() => setModalData(null)} />}
    </div>
  );
}
