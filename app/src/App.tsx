import { useEffect, useState } from 'react';
import AccountList from './components/AccountList';
import { AssumablesResponse } from './types';

export default function App() {
  const [data, setData] = useState<AssumablesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/assumables')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading AWS Accounts...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!data || Object.keys(data).length === 0) return <p>No accounts found.</p>;

  return (
    <div>
      <h1>AWS SSO Access Portal</h1>
      <AccountList data={data} />
    </div>
  );
}
