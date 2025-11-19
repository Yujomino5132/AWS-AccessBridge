import { useState, useEffect } from 'react';
import AccessKeyModal from './AccessKeyModal';

type RoleMap = Record<string, { roles: string[]; nickname?: string }>;

export default function AccountList() {
  const [rolesData, setRolesData] = useState<RoleMap>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalData, setModalData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<string | null>(null);
  const [loadingConsole, setLoadingConsole] = useState<string | null>(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_OPTIONAL_BACKEND_URL || '';
    const baseUrl = backendUrl ? backendUrl : '';
    fetch(`${baseUrl}/api/user/assumables`)
      .then(async (res) => {
        if (res.status === 401) {
          window.location.reload();
          return;
        }
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const errorMsg = errorData?.Exception?.Message || `Failed to load accounts: ${res.status} ${res.statusText}`;
          throw new Error(errorMsg);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setRolesData(data);
          setExpanded(Object.fromEntries(Object.keys(data).map((id) => [id, false])));
          setError(null);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load AWS accounts');
      });
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAccessKeys = async (accountId: string, role: string) => {
    const principalArn = `arn:aws:iam::${accountId}:role/${role}`;
    const loadingKey = `${accountId}-${role}`;

    setLoadingKeys(loadingKey);
    try {
      const backendUrl = import.meta.env.VITE_OPTIONAL_BACKEND_URL || '';
      const baseUrl = backendUrl ? backendUrl : '';
      const assumeRes = await fetch(`${baseUrl}/api/aws/assume-role`, {
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
    const principalArn = `arn:aws:iam::${accountId}:role/${role}`;
    const loadingKey = `${accountId}-${role}`;

    setLoadingConsole(loadingKey);
    try {
      const backendUrl = import.meta.env.VITE_OPTIONAL_BACKEND_URL || '';
      const baseUrl = backendUrl ? backendUrl : '';
      const assumeRes = await fetch(`${baseUrl}/api/aws/assume-role`, {
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

      const consoleRes = await fetch(`${baseUrl}/api/aws/console`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });

      if (consoleRes.status === 401) {
        window.location.reload();
        return;
      }

      if (!consoleRes.ok) {
        const errorText = await consoleRes.text();
        throw new Error(`Console login failed: ${consoleRes.status} ${errorText}`);
      }

      const { url } = await consoleRes.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoadingConsole(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
      {Object.entries(rolesData).map(([accountId, accountData]) => (
        <div key={accountId} className="bg-gray-800 rounded p-4 my-2 text-white shadow">
          <div className="flex items-center cursor-pointer" onClick={() => toggleExpand(accountId)}>
            <svg
              className={`w-3 h-3 mr-2 transform transition-transform ${expanded[accountId] ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <div className="text-lg font-semibold">{accountData.nickname ? `${accountData.nickname} (${accountId})` : accountId}</div>
          </div>
          {expanded[accountId] && (
            <div className="ml-6 mt-2 space-y-2">
              {accountData.roles.map((role) => {
                const loadingKey = `${accountId}-${role}`;
                const isLoadingKeys = loadingKeys === loadingKey;
                const isLoadingConsole = loadingConsole === loadingKey;

                return (
                  <div key={role} className="flex justify-between items-center">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isLoadingConsole) handleConsole(accountId, role);
                      }}
                      className={`transition-colors ${
                        isLoadingConsole ? 'text-gray-400 cursor-not-allowed' : 'text-blue-400 hover:underline'
                      }`}
                    >
                      {isLoadingConsole ? '⏳ Opening Console...' : role}
                    </a>
                    <button
                      className={`text-sm transition-colors ${isLoadingKeys ? 'text-gray-400' : 'text-blue-300 hover:text-blue-500'}`}
                      onClick={() => handleAccessKeys(accountId, role)}
                      disabled={isLoadingKeys}
                    >
                      {isLoadingKeys ? '⏳ Loading...' : '🔑 Access Keys'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {modalData && <AccessKeyModal {...modalData} onClose={() => setModalData(null)} />}
    </div>
  );
}
