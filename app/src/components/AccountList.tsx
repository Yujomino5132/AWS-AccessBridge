import { useState, useEffect } from 'react';
import AccessKeyModal from './AccessKeyModal';

type RoleMap = Record<string, string[]>;

export default function AccountList() {
  const [rolesData, setRolesData] = useState<RoleMap>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalData, setModalData] = useState<any | null>(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_OPTIONAL_BACKEND_URL || '';
    const baseUrl = backendUrl ? backendUrl : '';
    fetch(`${baseUrl}/api/user/assumables`)
      .then((res) => {
        if (res.status === 401) {
          window.location.reload();
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setRolesData(data);
          setExpanded(Object.fromEntries(Object.keys(data).map((id) => [id, false])));
        }
      })
      .catch(() => {
        // Error handling - could show an error message
      });
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAccessKeys = async (accountId: string, role: string) => {
    const principalArn = `arn:aws:iam::${accountId}:role/${role}`;

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
    }
  };

  const handleConsole = async (accountId: string, role: string) => {
    const principalArn = `arn:aws:iam::${accountId}:role/${role}`;

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
    }
  };

  return (
    <div>
      {Object.entries(rolesData).map(([accountId, roles]) => (
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
            <div className="text-lg font-semibold">{accountId}</div>
          </div>
          {expanded[accountId] && (
            <div className="ml-6 mt-2 space-y-2">
              {roles.map((role) => (
                <div key={role} className="flex justify-between items-center">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleConsole(accountId, role);
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    {role}
                  </a>
                  <button className="text-sm text-blue-300 hover:text-blue-500" onClick={() => handleAccessKeys(accountId, role)}>
                    🔑 Access keys
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {modalData && <AccessKeyModal {...modalData} onClose={() => setModalData(null)} />}
    </div>
  );
}
