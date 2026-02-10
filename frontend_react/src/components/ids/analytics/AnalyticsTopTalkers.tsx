import React from 'react';
import { Globe, AlertTriangle } from 'lucide-react';

interface TopTalker {
  ip: string;
  count: number;
  last_seen: string;
  threat_score: number;
}

interface TopTalkersProps {
  talkers: TopTalker[];
  onIPClick?: (ip: string) => void;
  loading?: boolean;
}

export const AnalyticsTopTalkers: React.FC<TopTalkersProps> = ({ talkers, onIPClick, loading }) => {
  const getThreatColor = (score: number) => {
    if (score >= 80) return '#ff6b6b';
    if (score >= 60) return '#ff9f43';
    if (score >= 40) return '#f6c244';
    return '#34d399';
  };

  if (loading) {
    return (
      <div className="prm-card" style={{ animation: 'pulse 2s infinite', height: '400px' }}></div>
    );
  }

  return (
    <div className="prm-card">
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f5f7fb', margin: '0 0 16px 0' }}>
        Top Talkers (Source IPs)
      </h3>

      {talkers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9fb3d9' }}>
          <Globe style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '13px' }}>No data available</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
          {talkers.map((talker, idx) => (
            <div
              key={talker.ip}
              onClick={() => onIPClick?.(talker.ip)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'rgba(148, 163, 184, 0.05)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(90, 201, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(90, 201, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getThreatColor(talker.threat_score)} 0%, rgba(90, 201, 255, 0.3) 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#050b1a' }}>
                    {idx + 1}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#f5f7fb', margin: 0, fontFamily: 'monospace' }}>
                    {talker.ip}
                  </p>
                  <p style={{ fontSize: '11px', color: '#9fb3d9', margin: '2px 0 0 0' }}>
                    {talker.count} alerts • {new Date(talker.last_seen).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: getThreatColor(talker.threat_score) }}>
                    {talker.threat_score}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>threat</div>
                </div>
                {talker.threat_score >= 70 && (
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#ff6b6b', flexShrink: 0 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
