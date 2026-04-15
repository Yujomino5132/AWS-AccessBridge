'use client';

import { useState, useCallback, useEffect } from 'react';

interface AuditLog {
  logId: string;
  timestamp: number;
  userEmail: string;
  action: string;
  resource?: string;
  method: string;
  path: string;
  statusCode: number;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogsTabProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export default function AuditLogsTab({ showMessage }: AuditLogsTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filters
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterEmail.trim()) params.set('userEmail', filterEmail.trim());
      if (filterAction.trim()) params.set('action', filterAction.trim());
      params.set('limit', pageSize.toString());
      params.set('offset', (page * pageSize).toString());

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch logs: ${response.status} ${text}`);
      }
      const data = (await response.json()) as { logs: AuditLog[]; total: number };
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [filterEmail, filterAction, page, showMessage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatTimestamp = (ts: number): string => {
    return new Date(ts * 1000).toLocaleString();
  };

  const statusColor = (code: number): string => {
    if (code < 300) return 'text-green-400';
    if (code < 400) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalPages = Math.ceil(total / pageSize);
  const inputClass =
    'p-2 bg-gray-750 rounded-lg border border-gray-700 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors';

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700/50 p-4 rounded-xl">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">User Email</label>
            <input
              type="text"
              value={filterEmail}
              onChange={(e) => {
                setFilterEmail(e.target.value);
                setPage(0);
              }}
              placeholder="Filter by email"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Action</label>
            <input
              type="text"
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(0);
              }}
              placeholder="e.g. ASSUME_ROLE"
              className={inputClass}
            />
          </div>
          <button
            onClick={fetchLogs}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Refresh
          </button>
          <span className="text-sm text-gray-500 ml-auto">{total} total entries</span>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto"></div>
        </div>
      )}

      {!isLoading && logs.length === 0 && <div className="text-center py-12 text-gray-500">No audit logs found.</div>}

      {!isLoading && logs.length > 0 && (
        <div className="bg-gray-800 border border-gray-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-750 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left p-3 font-medium">Time</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <>
                  <tr
                    key={log.logId}
                    className="border-t border-gray-700/50 hover:bg-gray-750 cursor-pointer transition-colors"
                    onClick={() => setExpandedLog(expandedLog === log.logId ? null : log.logId)}
                  >
                    <td className="p-3 text-gray-300 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                    <td className="p-3 text-gray-300 truncate max-w-32">{log.userEmail}</td>
                    <td className="p-3 font-medium text-white">{log.action}</td>
                    <td className="p-3 text-gray-400">{log.method}</td>
                    <td className={`p-3 font-mono ${statusColor(log.statusCode)}`}>{log.statusCode}</td>
                    <td className="p-3 text-gray-500 text-xs">{log.ipAddress || '-'}</td>
                  </tr>
                  {expandedLog === log.logId && (
                    <tr key={`${log.logId}-detail`} className="bg-gray-850">
                      <td colSpan={6} className="p-4 text-xs text-gray-300 space-y-1.5">
                        <div>
                          <span className="text-gray-500 font-medium">Path:</span> <span className="font-mono">{log.path}</span>
                        </div>
                        {log.resource && (
                          <div>
                            <span className="text-gray-500 font-medium">Resource:</span> {log.resource}
                          </div>
                        )}
                        {log.detail && (
                          <div>
                            <span className="text-gray-500 font-medium">Detail:</span> {log.detail}
                          </div>
                        )}
                        {log.userAgent && (
                          <div>
                            <span className="text-gray-500 font-medium">User Agent:</span> {log.userAgent}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 font-medium">Log ID:</span> <span className="font-mono">{log.logId}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-750 transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-750 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
