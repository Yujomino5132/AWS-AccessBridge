import { useEffect } from 'react';

interface Props {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
  onClose: () => void;
}

export default function AccessKeyModal({ accessKeyId, secretAccessKey, sessionToken, expiration, onClose }: Props) {
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-6 rounded-xl shadow-2xl w-full max-w-xl animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Access Keys</h2>
        <pre className="bg-gray-700 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
          export AWS_ACCESS_KEY_ID="{accessKeyId}"<br />
          export AWS_SECRET_ACCESS_KEY="{secretAccessKey}"<br />
          export AWS_SESSION_TOKEN="{sessionToken}"<br /># Expiration: {expiration}
        </pre>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition"
            onClick={() =>
              copyToClipboard(
                `export AWS_ACCESS_KEY_ID="${accessKeyId}"\nexport AWS_SECRET_ACCESS_KEY="${secretAccessKey}"\nexport AWS_SESSION_TOKEN="${sessionToken}"`,
              )
            }
          >
            📋 Copy All
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition" onClick={onClose}>
            ✖ Close
          </button>
        </div>
      </div>
    </div>
  );
}
