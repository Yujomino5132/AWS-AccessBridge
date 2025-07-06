import { useState } from 'react';
import { AccessKeysResponse } from '../types';
import AccessKeysModal from './AccessKeysModal';
import { buildPrincipalArn } from '../utils';

interface Props {
  data: Record<string, string[]>;
}

export default function AccountList({ data }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modalData, setModalData] = useState<AccessKeysResponse | null>(null);

  const toggleExpand = (accountId: string) => {
    setExpanded((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const handleAccessKeys = async (accountId: string, role: string) => {
    const principalArn = buildPrincipalArn(accountId, role);
    const assumeRes = await fetch('/api/aws/assume-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalArn }),
    });
    const keys = await assumeRes.json();
    setModalData(keys);
  };

  const handleConsole = async (accountId: string, role: string) => {
    const principalArn = buildPrincipalArn(accountId, role);
    const assumeRes = await fetch('/api/aws/assume-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalArn }),
    });
    const keys = await assumeRes.json();

    const consoleRes = await fetch('/api/aws/console', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys),
    });
    const { url } = await consoleRes.json();
    window.open(url, '_blank');
  };

  return (
    <div>
      {Object.entries(data).map(([accountId, roles]) => (
        <div key={accountId} style={{ marginBottom: '1em' }}>
          <div onClick={() => toggleExpand(accountId)} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
            {accountId} {expanded[accountId] ? '▲' : '▼'}
          </div>
          {expanded[accountId] && (
            <ul>
              {roles.map((role) => (
                <li key={role} style={{ marginLeft: '1em' }}>
                  🔗{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleConsole(accountId, role);
                    }}
                  >
                    {role}
                  </a>{' '}
                  | <button onClick={() => handleAccessKeys(accountId, role)}>AccessKeys</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <AccessKeysModal data={modalData} onClose={() => setModalData(null)} />
    </div>
  );
}
