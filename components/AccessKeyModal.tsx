'use client';

import { useEffect, useState } from 'react';

interface Props {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
  onClose: () => void;
}

export default function AccessKeyModal({ accessKeyId, secretAccessKey, sessionToken, expiration, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-800 border border-gray-700/50 text-white p-6 rounded-2xl shadow-2xl w-full max-w-xl mx-4 animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-gray-100">Access Keys</h2>
        <pre className="bg-gray-900 border border-gray-700/50 p-4 rounded-xl text-sm overflow-x-auto whitespace-pre-wrap font-mono text-gray-300">
          export AWS_ACCESS_KEY_ID="{accessKeyId}"<br />
          export AWS_SECRET_ACCESS_KEY="{secretAccessKey}"<br />
          export AWS_SESSION_TOKEN="{sessionToken}"<br />
          <span className="text-gray-500"># Expiration: {expiration}</span>
        </pre>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() =>
              copyToClipboard(
                `export AWS_ACCESS_KEY_ID="${accessKeyId}"\nexport AWS_SECRET_ACCESS_KEY="${secretAccessKey}"\nexport AWS_SESSION_TOKEN="${sessionToken}"`,
              )
            }
          >
            {copied ? 'Copied!' : 'Copy All'}
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
