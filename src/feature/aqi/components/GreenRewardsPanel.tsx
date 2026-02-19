'use client';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

interface RewardsState {
  points: number;
  totalPointsIssued: number;
  totalActions: number;
  appId: number;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

interface GreenRewardsPanelProps {
  /** Algorand address / user ID to look up */
  userId?: string;
  /** Fires whenever a new tree is planted, to trigger a refresh */
  refreshTrigger?: number;
}

/**
 * GreenRewardsPanel
 *
 * Shows the user's live on-chain Green Points balance fetched directly
 * from the GreenRewards smart contract on Algorand (App ID from env).
 */
export const GreenRewardsPanel: React.FC<GreenRewardsPanelProps> = ({
  userId,
  refreshTrigger = 0,
}) => {
  const [state, setState] = useState<RewardsState>({
    points: 0,
    totalPointsIssued: 0,
    totalActions: 0,
    appId: 0,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchRewards = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const server = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'http://localhost';
      const port = process.env.NEXT_PUBLIC_ALGOD_PORT || '4001';
      const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
      const appId = parseInt(process.env.NEXT_PUBLIC_REWARDS_APP_ID || '0');

      if (!appId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Rewards App ID not configured',
        }));
        return;
      }

      const base = `${server}:${port}`;
      const headers = { 'X-Algo-API-Token': token };

      // Fetch global state
      const appRes = await fetch(`${base}/v2/applications/${appId}`, {
        headers,
      });
      if (!appRes.ok) throw new Error(`App ${appId} not found`);
      const appData = await appRes.json();

      const globalState: Record<string, number> = {};
      for (const item of appData?.params?.['global-state'] ?? []) {
        const key = atob(item.key);
        globalState[key] = item.value.uint ?? 0;
      }

      // If we have a userId, fetch their box
      let userPoints = 0;
      if (userId) {
        try {
          const boxKeyRaw = 'pts:' + userId;
          const boxKeyB64 = btoa(boxKeyRaw);
          const boxRes = await fetch(
            `${base}/v2/applications/${appId}/box?name=b64:${encodeURIComponent(boxKeyB64)}`,
            { headers },
          );
          if (boxRes.ok) {
            const boxData = await boxRes.json();
            // Value is base64 encoded big-endian uint64
            const bytes = Uint8Array.from(atob(boxData.value), (c) =>
              c.charCodeAt(0),
            );
            const view = new DataView(bytes.buffer);
            userPoints = Number(view.getBigUint64(0));
          }
        } catch {
          // User has no box yet = 0 points
          userPoints = 0;
        }
      }

      setState({
        points: userPoints,
        totalPointsIssued: globalState['totalPointsIssued'] ?? 0,
        totalActions: globalState['totalActions'] ?? 0,
        appId,
        loading: false,
        error: null,
        lastUpdated: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });

      // Animate points counter on update
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Could not reach Algorand node',
      }));
    }
  }, [userId]);

  // Fetch on mount and when refreshTrigger changes (tree planted)
  useEffect(() => {
    fetchRewards();
  }, [fetchRewards, refreshTrigger]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchRewards, 15000);
    return () => clearInterval(interval);
  }, [fetchRewards]);

  const loraUrl = `https://lora.algokit.io/localnet/application/${state.appId}`;

  return (
    <>
      <style>{`
        .gr-panel {
          position: fixed;
          top: 90px;
          right: 20px;
          z-index: 1000;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          width: 280px;
        }

        .gr-badge {
          background: linear-gradient(135deg, #0a1628 0%, #0d2137 100%);
          border: 1px solid rgba(52, 211, 153, 0.3);
          border-radius: 16px;
          padding: 14px 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow:
            0 4px 24px rgba(0,0,0,0.4),
            0 0 0 1px rgba(52,211,153,0.1),
            inset 0 1px 0 rgba(255,255,255,0.05);
          transition: all 0.25s ease;
          user-select: none;
        }

        .gr-badge:hover {
          border-color: rgba(52, 211, 153, 0.6);
          box-shadow:
            0 8px 32px rgba(0,0,0,0.5),
            0 0 20px rgba(52,211,153,0.15),
            inset 0 1px 0 rgba(255,255,255,0.08);
          transform: translateY(-1px);
        }

        .gr-leaf {
          font-size: 28px;
          line-height: 1;
          filter: drop-shadow(0 0 8px rgba(52,211,153,0.6));
          animation: gr-pulse 3s ease-in-out infinite;
        }

        @keyframes gr-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(52,211,153,0.5)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 16px rgba(52,211,153,0.9)); }
        }

        .gr-badge-info { flex: 1; min-width: 0; }

        .gr-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(52, 211, 153, 0.7);
          margin-bottom: 2px;
        }

        .gr-points {
          font-size: 24px;
          font-weight: 800;
          color: #34d399;
          line-height: 1;
          transition: all 0.3s ease;
          font-variant-numeric: tabular-nums;
        }

        .gr-points.animating {
          transform: scale(1.15);
          color: #6ee7b7;
          text-shadow: 0 0 20px rgba(52,211,153,0.8);
        }

        .gr-pts-label {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }

        .gr-loading-dot {
          width: 8px; height: 8px;
          background: #34d399;
          border-radius: 50%;
          animation: gr-blink 1s ease-in-out infinite;
        }

        @keyframes gr-blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.2; }
        }

        .gr-chevron {
          color: rgba(255,255,255,0.3);
          font-size: 12px;
          transition: transform 0.25s ease;
        }
        .gr-chevron.open { transform: rotate(180deg); }

        /* Expanded panel */
        .gr-expanded {
          background: linear-gradient(135deg, #0a1628 0%, #0d1f3a 100%);
          border: 1px solid rgba(52, 211, 153, 0.25);
          border-radius: 0 0 16px 16px;
          border-top: none;
          margin-top: -4px;
          padding: 16px;
          box-shadow:
            0 16px 48px rgba(0,0,0,0.5),
            0 0 0 1px rgba(52,211,153,0.08);
          overflow: hidden;
        }

        .gr-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(52,211,153,0.2), transparent);
          margin: 12px 0;
        }

        .gr-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }

        .gr-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .gr-stat-value {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          font-variant-numeric: tabular-nums;
        }

        .gr-stat-value.green { color: #34d399; }

        .gr-chain-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #34d399;
          margin-top: 12px;
          width: 100%;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .gr-chain-badge:hover {
          background: rgba(52,211,153,0.15);
          border-color: rgba(52,211,153,0.4);
          color: #6ee7b7;
        }

        .gr-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px #34d399;
          animation: gr-blink 2s ease-in-out infinite;
        }

        .gr-refresh-btn {
          background: none;
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 8px;
          color: rgba(52,211,153,0.6);
          font-size: 11px;
          padding: 5px 12px;
          cursor: pointer;
          width: 100%;
          margin-top: 8px;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .gr-refresh-btn:hover {
          background: rgba(52,211,153,0.08);
          border-color: rgba(52,211,153,0.4);
          color: #34d399;
        }

        .gr-error {
          font-size: 11px;
          color: #f87171;
          text-align: center;
          padding: 8px;
          background: rgba(248,113,113,0.08);
          border-radius: 8px;
          border: 1px solid rgba(248,113,113,0.15);
        }

        .gr-updated {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          text-align: center;
          margin-top: 8px;
        }

        .gr-no-wallet {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          text-align: center;
          font-style: italic;
          padding: 4px 0;
        }
      `}</style>

      <div className="gr-panel">
        {/* Collapsed badge — always visible */}
        <div className="gr-badge" onClick={() => setIsExpanded((e) => !e)}>
          <div className="gr-leaf">🌿</div>

          <div className="gr-badge-info">
            <div className="gr-label">Green Points</div>
            {state.loading ? (
              <div className="gr-loading-dot" />
            ) : state.error ? (
              <div style={{ fontSize: 11, color: '#f87171' }}>Offline</div>
            ) : (
              <>
                <div className={`gr-points ${isAnimating ? 'animating' : ''}`}>
                  {state.points.toLocaleString()}
                </div>
                <div className="gr-pts-label">pts on Algorand</div>
              </>
            )}
          </div>

          <div className={`gr-chevron ${isExpanded ? 'open' : ''}`}>▼</div>
        </div>

        {/* Expanded details panel */}
        {isExpanded && (
          <div className="gr-expanded">
            {state.error ? (
              <div className="gr-error">⚠ {state.error}</div>
            ) : (
              <>
                {/* My balance */}
                {userId ? (
                  <div className="gr-stat-row">
                    <span className="gr-stat-label">🎯 My balance</span>
                    <span className="gr-stat-value green">
                      {state.points.toLocaleString()} pts
                    </span>
                  </div>
                ) : (
                  <div className="gr-no-wallet">
                    Plant a tree to earn points!
                  </div>
                )}

                <div className="gr-divider" />

                {/* Global stats */}
                <div className="gr-stat-row">
                  <span className="gr-stat-label">🌍 Total issued</span>
                  <span className="gr-stat-value">
                    {state.totalPointsIssued.toLocaleString()} pts
                  </span>
                </div>
                <div className="gr-stat-row">
                  <span className="gr-stat-label">🌱 Actions recorded</span>
                  <span className="gr-stat-value">{state.totalActions}</span>
                </div>
                <div className="gr-stat-row">
                  <span className="gr-stat-label">🔗 Contract ID</span>
                  <span className="gr-stat-value">App {state.appId}</span>
                </div>

                <div className="gr-divider" />

                {/* Lora link */}
                <a
                  className="gr-chain-badge"
                  href={loraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="gr-dot" />
                  LIVE ON ALGORAND — VIEW ON LORA ↗
                </a>

                <button className="gr-refresh-btn" onClick={fetchRewards}>
                  ↺ Refresh Balance
                </button>

                {state.lastUpdated && (
                  <div className="gr-updated">Updated {state.lastUpdated}</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default GreenRewardsPanel;
