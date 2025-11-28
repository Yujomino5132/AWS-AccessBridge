import { useState } from 'react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('credentials');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const tabs = [
    { id: 'credentials', label: 'Credentials' },
    { id: 'access', label: 'User Access' },
    { id: 'accounts', label: 'Account Nicknames' },
    { id: 'crypto', label: 'Encryption' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8">
      {message && (
        <div className={`mb-6 p-4 rounded ${message.type === 'success' ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'credentials' && <CredentialsTab showMessage={showMessage} />}
      {activeTab === 'access' && <AccessTab showMessage={showMessage} />}
      {activeTab === 'accounts' && <AccountsTab showMessage={showMessage} />}
      {activeTab === 'crypto' && <CryptoTab showMessage={showMessage} />}
    </div>
  );
}

function CredentialsTab({ showMessage }: { showMessage: (type: 'success' | 'error', text: string) => void }) {
  const [credForm, setCredForm] = useState({
    principalArn: '',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
  });
  const [relationForm, setRelationForm] = useState({
    principalArn: '',
    assumedBy: '',
  });

  const isCredFormValid =
    credForm.principalArn.trim() !== '' && credForm.accessKeyId.trim() !== '' && credForm.secretAccessKey.trim() !== '';
  const isRelationFormValid = relationForm.principalArn.trim() !== '' && relationForm.assumedBy.trim() !== '';
  const isRemoveRelationFormValid = relationForm.principalArn.trim() !== '';

  const handleAddCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCredFormValid) return;

    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalArn: credForm.principalArn,
          accessKeyId: credForm.accessKeyId,
          secretAccessKey: credForm.secretAccessKey,
          ...(credForm.sessionToken && { sessionToken: credForm.sessionToken }),
        }),
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      if (response.ok) {
        showMessage('success', 'Credentials added successfully');
        setCredForm({ principalArn: '', accessKeyId: '', secretAccessKey: '', sessionToken: '' });
      } else {
        let errorMessage = 'Failed to add credentials';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRelationFormValid) return;

    try {
      const response = await fetch('/api/admin/credentials/relationship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalArn: relationForm.principalArn,
          assumedBy: relationForm.assumedBy,
        }),
      });

      const responseText = await response.text();
      console.log('Relationship response:', response.status, responseText);

      if (response.ok) {
        showMessage('success', 'Credential relationship added successfully');
        setRelationForm({ principalArn: '', assumedBy: '' });
      } else {
        let errorMessage = 'Failed to add relationship';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRemoveRelationFormValid) return;

    try {
      const response = await fetch('/api/admin/credentials/relationship', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalArn: relationForm.principalArn,
        }),
      });

      const responseText = await response.text();
      console.log('Remove relationship response:', response.status, responseText);

      if (response.ok) {
        showMessage('success', 'Credential relationship removed successfully');
        setRelationForm({ principalArn: '', assumedBy: '' });
      } else {
        let errorMessage = 'Failed to remove relationship';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-6 rounded">
        <h3 className="text-xl font-semibold mb-4">Add AWS Credentials</h3>
        <form onSubmit={handleAddCredentials} className="space-y-4">
          <input
            type="text"
            placeholder="Principal ARN (e.g., arn:aws:iam::123456789012:user/username)"
            value={credForm.principalArn}
            onChange={(e) => setCredForm({ ...credForm, principalArn: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
            required
          />
          <input
            type="text"
            placeholder="Access Key ID"
            value={credForm.accessKeyId}
            onChange={(e) => setCredForm({ ...credForm, accessKeyId: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
            required
          />
          <input
            type="password"
            placeholder="Secret Access Key"
            value={credForm.secretAccessKey}
            onChange={(e) => setCredForm({ ...credForm, secretAccessKey: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
            required
          />
          <input
            type="password"
            placeholder="Session Token (Optional)"
            value={credForm.sessionToken}
            onChange={(e) => setCredForm({ ...credForm, sessionToken: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
          />
          <button
            type="submit"
            disabled={!isCredFormValid}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
          >
            Add Credentials
          </button>
        </form>
      </div>

      <div className="bg-gray-800 p-6 rounded">
        <h3 className="text-xl font-semibold mb-4">Manage Credential Relationships</h3>
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Principal ARN"
            value={relationForm.principalArn}
            onChange={(e) => setRelationForm({ ...relationForm, principalArn: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
            required
          />
          <input
            type="text"
            placeholder="Assumed By ARN"
            value={relationForm.assumedBy}
            onChange={(e) => setRelationForm({ ...relationForm, assumedBy: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
            required
          />
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleAddRelation}
              disabled={!isRelationFormValid}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
            >
              Add Relationship
            </button>
            <button
              type="button"
              onClick={handleRemoveRelation}
              disabled={!isRemoveRelationFormValid}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
            >
              Remove Relationship
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccessTab({ showMessage }: { showMessage: (type: 'success' | 'error', text: string) => void }) {
  const [accessForm, setAccessForm] = useState({
    userEmail: '',
    awsAccountId: '',
    roleName: '',
  });

  const isFormValid = accessForm.awsAccountId.trim() !== '' && accessForm.roleName.trim() !== '';

  const handleGrantAccess = async () => {
    if (!isFormValid) return;

    try {
      const response = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: accessForm.userEmail || undefined,
          awsAccountId: accessForm.awsAccountId,
          roleName: accessForm.roleName,
        }),
      });

      const responseText = await response.text();
      console.log('Grant access response:', response.status, responseText);

      if (response.ok) {
        showMessage('success', 'Access granted successfully');
        setAccessForm({ userEmail: '', awsAccountId: '', roleName: '' });
      } else {
        let errorMessage = 'Failed to grant access';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRevokeAccess = async () => {
    if (!isFormValid) return;

    try {
      const response = await fetch('/api/admin/access', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: accessForm.userEmail || undefined,
          awsAccountId: accessForm.awsAccountId,
          roleName: accessForm.roleName,
        }),
      });

      const responseText = await response.text();
      console.log('Revoke access response:', response.status, responseText);

      if (response.ok) {
        showMessage('success', 'Access revoked successfully');
        setAccessForm({ userEmail: '', awsAccountId: '', roleName: '' });
      } else {
        let errorMessage = 'Failed to revoke access';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded">
      <h3 className="text-xl font-semibold mb-4">Manage User Access</h3>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="AWS Account ID (12 digits)"
          value={accessForm.awsAccountId}
          onChange={(e) => setAccessForm({ ...accessForm, awsAccountId: e.target.value })}
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
          pattern="[0-9]{12}"
        />
        <input
          type="text"
          placeholder="Role Name"
          value={accessForm.roleName}
          onChange={(e) => setAccessForm({ ...accessForm, roleName: e.target.value })}
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
        />
        <input
          type="email"
          placeholder="User Email (Optional, defaults to current user)"
          value={accessForm.userEmail}
          onChange={(e) => setAccessForm({ ...accessForm, userEmail: e.target.value })}
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
        />
        <div className="flex space-x-4">
          <button
            onClick={handleGrantAccess}
            disabled={!isFormValid}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
          >
            Grant Access
          </button>
          <button
            onClick={handleRevokeAccess}
            disabled={!isFormValid}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
          >
            Revoke Access
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountsTab({ showMessage }: { showMessage: (type: 'success' | 'error', text: string) => void }) {
  const [nicknameForm, setNicknameForm] = useState({
    awsAccountId: '',
    nickname: '',
  });

  const isSetNicknameValid = nicknameForm.awsAccountId.trim() !== '' && nicknameForm.nickname.trim() !== '';
  const isRemoveNicknameValid = nicknameForm.awsAccountId.trim() !== '';

  const handleSetNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSetNicknameValid) return;

    try {
      const response = await fetch('/api/admin/account/nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awsAccountId: nicknameForm.awsAccountId,
          nickname: nicknameForm.nickname,
        }),
      });

      const responseText = await response.text();
      console.log('Set nickname response:', response.status, responseText);

      if (response.ok) {
        showMessage('success', 'Account nickname set successfully');
        setNicknameForm({ awsAccountId: '', nickname: '' });
      } else {
        let errorMessage = 'Failed to set nickname';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRemoveNicknameValid) return;

    try {
      const response = await fetch('/api/admin/account/nickname', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awsAccountId: nicknameForm.awsAccountId,
        }),
      });

      const responseText = await response.text();
      console.log('Remove nickname response:', response.status, responseText);

      if (response.ok) {
        showMessage('success', 'Account nickname removed successfully');
        setNicknameForm({ awsAccountId: '', nickname: '' });
      } else {
        let errorMessage = 'Failed to remove nickname';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded">
      <h3 className="text-xl font-semibold mb-4">Manage Account Nicknames</h3>
      <form className="space-y-4">
        <input
          type="text"
          placeholder="AWS Account ID (12 digits)"
          value={nicknameForm.awsAccountId}
          onChange={(e) => setNicknameForm({ ...nicknameForm, awsAccountId: e.target.value })}
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
          pattern="[0-9]{12}"
          required
        />
        <input
          type="text"
          placeholder="Account Nickname"
          value={nicknameForm.nickname}
          onChange={(e) => setNicknameForm({ ...nicknameForm, nickname: e.target.value })}
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
        />
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleSetNickname}
            disabled={!isSetNicknameValid}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
          >
            Set Nickname
          </button>
          <button
            type="button"
            onClick={handleRemoveNickname}
            disabled={!isRemoveNicknameValid}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
          >
            Remove Nickname
          </button>
        </div>
      </form>
    </div>
  );
}

function CryptoTab({ showMessage }: { showMessage: (type: 'success' | 'error', text: string) => void }) {
  const [isRotating, setIsRotating] = useState(false);

  const handleRotateKey = async () => {
    setIsRotating(true);
    try {
      const response = await fetch('/api/admin/crypto/rotate-master-key', {
        method: 'POST',
      });

      const responseText = await response.text();
      console.log('Rotate key response:', response.status, responseText);

      if (response.ok) {
        showMessage('success', 'Encryption key rotated successfully');
      } else {
        let errorMessage = 'Failed to rotate encryption key';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.Exception?.Message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        showMessage('error', errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      showMessage('error', `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded">
      <h3 className="text-xl font-semibold mb-4">Encryption Key Management</h3>
      <div className="space-y-4">
        <p className="text-gray-300">
          Rotate the master encryption key used for encrypting AWS credentials in the database. This operation will re-encrypt all existing
          credentials with the new key.
        </p>
        <button
          onClick={handleRotateKey}
          disabled={isRotating}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded text-white"
        >
          {isRotating ? 'Rotating...' : 'Rotate Master Key'}
        </button>
      </div>
    </div>
  );
}
