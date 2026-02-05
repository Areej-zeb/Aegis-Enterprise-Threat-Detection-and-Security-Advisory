import React from 'react';
import '../../index.css';

const StatusBar = ({ env = 'Demo', ids = 'Healthy' }) => (
  <div className="prm-status-bar" style={{
    width: '100%',
    background: 'rgba(10,18,39,0.85)',
    color: '#c8d5f3',
    fontSize: '0.98rem',
    padding: '0.5rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    borderBottom: '1px solid rgba(90,201,255,0.08)',
    letterSpacing: '0.01em',
    zIndex: 100,
  }}>
    <span>Env: <span style={{ fontWeight: 600 }}>{env}</span></span>
    <span style={{ fontSize: '1.2em', margin: '0 0.5em' }}>•</span>
    <span>IDS: <span style={{ fontWeight: 600, color: '#34d399' }}>{ids}</span></span>
  </div>
);

export default StatusBar;
