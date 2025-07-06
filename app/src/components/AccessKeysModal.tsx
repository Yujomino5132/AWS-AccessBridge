import { AccessKeysResponse } from '../types';
import { exportEnv } from '../utils';

interface Props {
  data: AccessKeysResponse | null;
  onClose: () => void;
}

export default function AccessKeysModal({ data, onClose }: Props) {
  if (!data) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Access Keys</h2>
        <pre>
          AWS_ACCESS_KEY_ID={data.accessKeyId}
          <br />
          AWS_SECRET_ACCESS_KEY={data.secretAccessKey}
          <br />
          AWS_SESSION_TOKEN={data.sessionToken}
          <br />
          Expiration: {data.expiration}
        </pre>
        <button onClick={() => navigator.clipboard.writeText(`${data.accessKeyId}\n${data.secretAccessKey}\n${data.sessionToken}`)}>
          📋 Copy Keys
        </button>
        <button onClick={() => navigator.clipboard.writeText(exportEnv(data.accessKeyId, data.secretAccessKey, data.sessionToken))}>
          🧪 Copy Export Commands
        </button>
        <button onClick={onClose}>❌ Close</button>
      </div>
    </div>
  );
}
