interface Props {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
  onClose: () => void;
}

export default function AccessKeyModal({ accessKeyId, secretAccessKey, sessionToken, expiration, onClose }: Props) {
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-6 rounded shadow-lg w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">Access Keys</h2>
        <pre className="bg-gray-700 p-4 rounded text-sm overflow-x-auto">
          export AWS_ACCESS_KEY_ID="{accessKeyId}"<br />
          export AWS_SECRET_ACCESS_KEY="{secretAccessKey}"<br />
          export AWS_SESSION_TOKEN="{sessionToken}"<br /># Expiration: {expiration}
        </pre>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
            onClick={() =>
              copyToClipboard(
                `export AWS_ACCESS_KEY_ID="${accessKeyId}"\nexport AWS_SECRET_ACCESS_KEY="${secretAccessKey}"\nexport AWS_SESSION_TOKEN="${sessionToken}"`,
              )
            }
          >
            Copy All
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
