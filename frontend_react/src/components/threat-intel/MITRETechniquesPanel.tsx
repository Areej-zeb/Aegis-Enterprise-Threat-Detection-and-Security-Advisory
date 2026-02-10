import React, { useState } from 'react';
import { ChevronDown, Shield, AlertCircle } from 'lucide-react';

interface Technique {
  id: string;
  name: string;
  description: string;
  tactic: string;
  mitigations: string[];
  detection_methods: string[];
}

interface MITRETechniquesPanelProps {
  techniques: Technique[];
  loading?: boolean;
}

export const MITRETechniquesPanel: React.FC<MITRETechniquesPanelProps> = ({ techniques, loading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tacticColors: Record<string, string> = {
    'Reconnaissance': '#5ac9ff',
    'Resource Development': '#06b6d4',
    'Initial Access': '#a78bfa',
    'Execution': '#ec4899',
    'Persistence': '#ff6b6b',
    'Privilege Escalation': '#ff9f43',
    'Defense Evasion': '#f6c244',
    'Credential Access': '#34d399',
    'Discovery': '#4f46e5',
    'Lateral Movement': '#a78bfa',
    'Collection': '#ec4899',
    'Command and Control': '#ff6b6b',
    'Exfiltration': '#ff9f43',
    'Impact': '#ff6b6b',
  };

  if (loading) {
    return (
      <div className="prm-card" style={{ animation: 'pulse 2s infinite' }}>
        <div style={{ height: '24px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '8px', marginBottom: '16px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '48px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '8px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (techniques.length === 0) {
    return (
      <div className="prm-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <Shield style={{ width: '48px', height: '48px', color: '#64748b', margin: '0 auto 12px' }} />
        <p style={{ color: '#9fb3d9', margin: 0 }}>No MITRE techniques detected</p>
      </div>
    );
  }

  return (
    <div className="prm-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Shield style={{ width: '20px', height: '20px', color: '#5ac9ff' }} />
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#f5f7fb' }}>MITRE ATT&CK Techniques</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {techniques.map((technique) => (
          <div key={technique.id} style={{ border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setExpandedId(expandedId === technique.id ? null : technique.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(148, 163, 184, 0.1)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, textAlign: 'left' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600', color: '#5ac9ff' }}>{technique.id}</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#f5f7fb' }}>{technique.name}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: tacticColors[technique.tactic] || '#5ac9ff',
                    color: '#050b1a',
                    fontWeight: '600',
                  }}
                >
                  {technique.tactic}
                </span>
              </div>
              <ChevronDown
                style={{
                  width: '20px',
                  height: '20px',
                  color: '#64748b',
                  transition: 'transform 0.2s ease',
                  transform: expandedId === technique.id ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {expandedId === technique.id && (
              <div style={{ background: 'rgba(10, 18, 39, 0.5)', padding: '16px', borderTop: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Description */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9', marginBottom: '8px', margin: 0 }}>Description</h4>
                  <p style={{ fontSize: '13px', color: '#9fb3d9', margin: 0 }}>{technique.description}</p>
                </div>

                {/* Mitigations */}
                {technique.mitigations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Shield style={{ width: '14px', height: '14px' }} />
                      Mitigations
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {technique.mitigations.map((mitigation, idx) => (
                        <li key={idx} style={{ fontSize: '12px', color: '#9fb3d9' }}>{mitigation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detection Methods */}
                {technique.detection_methods.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      Detection Methods
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {technique.detection_methods.map((method, idx) => (
                        <li key={idx} style={{ fontSize: '12px', color: '#9fb3d9' }}>{method}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
