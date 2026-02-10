import React, { useState } from 'react';
import { Search, Globe, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';

interface IPReputation {
  ip_address: string;
  reputation_score: number;
  threat_count: number;
  is_malicious: boolean;
  threat_types: string[];
  country?: string;
  asn?: string;
  last_seen: string;
}

interface IPReputationCheckerProps {
  onCheck?: (ip: string) => Promise<IPReputation | null>;
}

export const IPReputationChecker: React.FC<IPReputationCheckerProps> = ({ onCheck }) => {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState<IPReputation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (onCheck) {
        const reputation = await onCheck(ip);
        if (reputation) {
          setResult(reputation);
        } else {
          setError('IP not found in reputation database');
        }
      }
    } catch (err) {
      setError('Failed to check IP reputation');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#ff6b6b';
    if (score >= 60) return '#ff9f43';
    if (score >= 40) return '#f6c244';
    return '#34d399';
  };

  return (
    <div className="prm-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Globe style={{ width: '20px', height: '20px', color: '#5ac9ff' }} />
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#f5f7fb' }}>IP Reputation Checker</h3>
      </div>

      {/* Search Form */}
      <form onSubmit={handleCheck} style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="Enter IP address (e.g., 203.0.113.45)"
          style={{
            flex: 1,
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#f5f7fb',
            fontSize: '13px',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#5ac9ff',
            border: 'none',
            color: '#050b1a',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Search style={{ width: '14px', height: '14px' }} />
          Check
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: '#ff6b6b', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div>
              <p style={{ fontFamily: 'monospace', fontSize: '14px', color: '#f5f7fb', margin: 0 }}>{result.ip_address}</p>
              {result.country && (
                <p style={{ fontSize: '12px', color: '#9fb3d9', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', margin: 0 }}>
                  <MapPin style={{ width: '12px', height: '12px' }} />
                  {result.country}
                  {result.asn && ` • ${result.asn}`}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {result.is_malicious ? (
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#ff6b6b' }} />
              ) : (
                <CheckCircle style={{ width: '24px', height: '24px', color: '#34d399' }} />
              )}
            </div>
          </div>

          {/* Reputation Score */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9' }}>Reputation Score</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: getScoreColor(result.reputation_score) }}>
                {result.reputation_score.toFixed(0)}/100
              </span>
            </div>
            <div style={{ width: '100%', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '999px', height: '8px' }}>
              <div
                style={{
                  height: '8px',
                  borderRadius: '999px',
                  background: getScoreColor(result.reputation_score),
                  width: `${result.reputation_score}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Threat Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '6px', padding: '12px' }}>
              <p style={{ fontSize: '11px', color: '#9fb3d9', margin: 0, marginBottom: '4px' }}>Threat Count</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#f5f7fb', margin: 0 }}>{result.threat_count}</p>
            </div>
            <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '6px', padding: '12px' }}>
              <p style={{ fontSize: '11px', color: '#9fb3d9', margin: 0, marginBottom: '4px' }}>Status</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: result.is_malicious ? '#ff6b6b' : '#34d399', margin: 0 }}>
                {result.is_malicious ? 'Malicious' : 'Clean'}
              </p>
            </div>
          </div>

          {/* Threat Types */}
          {result.threat_types.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9', margin: '0 0 8px 0' }}>Threat Types</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.threat_types.map((threat, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(255, 107, 107, 0.2)',
                      color: '#ff6b6b',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {threat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last Seen */}
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            Last seen: {new Date(result.last_seen).toLocaleString()}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
          <div style={{ animation: 'spin 1s linear infinite', width: '32px', height: '32px', border: '2px solid rgba(148, 163, 184, 0.3)', borderTop: '2px solid #5ac9ff', borderRadius: '50%' }}></div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9fb3d9' }}>
          <Globe style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '13px' }}>Enter an IP address to check its reputation</p>
        </div>
      )}
    </div>
  );
};
