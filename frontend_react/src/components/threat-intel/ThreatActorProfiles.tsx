import React, { useState } from 'react';
import { Users, Target, Zap, ChevronDown } from 'lucide-react';

interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  targets: string[];
  techniques: string[];
  last_seen?: string;
  threat_level: string;
}

interface ThreatActorProfilesProps {
  actors: ThreatActor[];
  loading?: boolean;
}

export const ThreatActorProfiles: React.FC<ThreatActorProfilesProps> = ({ actors, loading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getThreatLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      critical: '#ff6b6b',
      high: '#ff9f43',
      medium: '#f6c244',
      low: '#5ac9ff',
    };
    return colors[level] || '#5ac9ff';
  };

  if (loading) {
    return (
      <div className="prm-card" style={{ animation: 'pulse 2s infinite' }}>
        <div style={{ height: '24px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '8px', marginBottom: '16px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '64px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '8px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (actors.length === 0) {
    return (
      <div className="prm-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <Users style={{ width: '48px', height: '48px', color: '#64748b', margin: '0 auto 12px' }} />
        <p style={{ color: '#9fb3d9', margin: 0 }}>No threat actors detected</p>
      </div>
    );
  }

  return (
    <div className="prm-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Users style={{ width: '20px', height: '20px', color: '#5ac9ff' }} />
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#f5f7fb' }}>Threat Actor Profiles</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {actors.map((actor) => (
          <div key={actor.id} style={{ border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setExpandedId(expandedId === actor.id ? null : actor.id)}
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
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: `linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f5f7fb',
                    fontWeight: '700',
                    fontSize: '14px',
                  }}
                >
                  {actor.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#f5f7fb' }}>{actor.name}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {actor.aliases.join(', ')}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: '600',
                    background: getThreatLevelColor(actor.threat_level),
                    color: '#050b1a',
                  }}
                >
                  {actor.threat_level.toUpperCase()}
                </span>
              </div>
              <ChevronDown
                style={{
                  width: '20px',
                  height: '20px',
                  color: '#64748b',
                  transition: 'transform 0.2s ease',
                  transform: expandedId === actor.id ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {expandedId === actor.id && (
              <div style={{ background: 'rgba(10, 18, 39, 0.5)', padding: '16px', borderTop: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Description */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9', marginBottom: '8px', margin: 0 }}>Description</h4>
                  <p style={{ fontSize: '13px', color: '#9fb3d9', margin: 0 }}>{actor.description}</p>
                </div>

                {/* Target Industries */}
                {actor.targets.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Target style={{ width: '14px', height: '14px' }} />
                      Target Industries
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {actor.targets.map((target, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(148, 163, 184, 0.1)',
                            color: '#9fb3d9',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {target}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Known Techniques */}
                {actor.techniques.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Zap style={{ width: '14px', height: '14px' }} />
                      Known Techniques
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {actor.techniques.map((technique, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(90, 201, 255, 0.2)',
                            color: '#5ac9ff',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {technique}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Seen */}
                {actor.last_seen && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                    Last seen: {new Date(actor.last_seen).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
