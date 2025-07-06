import { useState, useEffect } from 'react';
import AccessKeyModal from './AccessKeyModal';

type RoleMap = Record<string, string[]>;

export default function AccountList() {
  const [rolesData, setRolesData] = useState<RoleMap>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalData, setModalData] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/user/assumables')
      .then((res) => res.json())
      .then((data) => {
        setRolesData(data);
        setExpanded(Object.fromEntries(Object.keys(data).map((id) => [id, false])));
      });
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAccessKeys = async (accountId: string, role: string) => {
    const principalArn = `arn:aws:iam::${accountId}:role/${role}`;
    const assumeRes = await fetch('/api/aws/assume-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalArn }),
    });
    const creds = await assumeRes.json();
    setModalData(creds);
  };

  const handleConsole = async (accountId: string, role: string) => {
    const principalArn = `arn:aws:iam::${accountId}:role/${role}`;
    const assumeRes = await fetch('/api/aws/assume-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalArn }),
    });
    const creds = await assumeRes.json();

    const consoleRes = await fetch('/api/aws/console', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const { url } = await consoleRes.json();
    window.open(url, '_blank');
  };

  return (
    <div>
      {Object.entries(rolesData).map(([accountId, roles]) => (
        <div key={accountId} className="bg-gray-800 rounded p-4 my-2 text-white shadow">
          <div className="flex items-center cursor-pointer" onClick={() => toggleExpand(accountId)}>
            <svg
              className={`w-4 h-4 mr-2 transform ${expanded[accountId] ? 'rotate-90' : ''} transition-transform`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 6l6 4-6 4V6z" />
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
