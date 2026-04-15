'use client';

import { useState, useEffect } from 'react';

interface CostSummary {
  accounts: Record<string, { totalCost: number; currency: string }>;
  grandTotal: number;
}

interface TrendMonth {
  period: string;
  total: number;
  byAccount: Record<string, number>;
}

export default function CostDashboard() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [trends, setTrends] = useState<TrendMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [summaryRes, trendsRes] = await Promise.all([fetch('/api/cost/summary'), fetch('/api/cost/trends?months=6')]);

        if (summaryRes.ok) {
          setSummary((await summaryRes.json()) as CostSummary);
        }
        if (trendsRes.ok) {
          const trendsData = (await trendsRes.json()) as { months: TrendMonth[] };
          setTrends(trendsData.months || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cost data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-400">Loading cost data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded">{error}</div>;
  }

  const maxTrend: number = trends.length > 0 ? Math.max(...trends.map((t) => t.total), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="bg-gray-800 border border-gray-700/50 p-6 rounded-xl">
          <p className="text-gray-400 text-sm mb-1">Total Spend (30d)</p>
          <p className="text-3xl font-bold text-white">${summary?.grandTotal?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700/50 p-6 rounded-xl">
          <p className="text-gray-400 text-sm mb-1">Accounts Tracked</p>
          <p className="text-3xl font-bold text-white">{Object.keys(summary?.accounts || {}).length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700/50 p-6 rounded-xl">
          <p className="text-gray-400 text-sm mb-1">Months of Data</p>
          <p className="text-3xl font-bold text-white">{trends.length}</p>
        </div>
      </div>

      {/* Trend Chart (SVG bar chart) */}
      {trends.length > 0 && (
        <div className="bg-gray-800 border border-gray-700/50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Monthly Cost Trends</h3>
          <div className="flex items-end gap-3 h-48">
            {trends.map((month) => (
              <div key={month.period} className="flex-1 flex flex-col items-center group">
                <span className="text-xs text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${month.total.toFixed(0)}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all group-hover:from-blue-500 group-hover:to-blue-300"
                  style={{ height: `${(month.total / maxTrend) * 100}%`, minHeight: month.total > 0 ? '4px' : '0' }}
                />
                <span className="text-xs text-gray-500 mt-2">{month.period.substring(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Breakdown */}
      {summary && Object.keys(summary.accounts).length > 0 && (
        <div className="bg-gray-800 border border-gray-700/50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Account Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(summary.accounts)
              .sort(([, a], [, b]) => b.totalCost - a.totalCost)
              .map(([accountId, data]) => (
                <div
                  key={accountId}
                  className="flex items-center justify-between p-3 bg-gray-750 border border-gray-700/30 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <span className="font-mono text-sm text-gray-300">{accountId}</span>
                  <span className="font-semibold">
                    ${data.totalCost.toFixed(2)} {data.currency}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!summary || Object.keys(summary.accounts).length === 0 ? (
        <div className="bg-gray-800 border border-gray-700/50 p-12 rounded-xl text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg text-gray-300 mb-2">No cost data available yet.</p>
          <p className="text-sm text-gray-500">Enable data collection for your accounts in the Admin panel to start tracking costs.</p>
        </div>
      ) : null}
    </div>
  );
}
