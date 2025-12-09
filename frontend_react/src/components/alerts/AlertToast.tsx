// src/components/alerts/AlertToast.tsx

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Alert } from '../../api/aegisClient';

interface AlertToastProps {
  alert: Alert;
  onClose: () => void;
  duration?: number;
}

export function AlertToast({ alert, onClose, duration = 5000 }: AlertToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#ff3366'; // Standardized Critical color
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: isVisible ? '20px' : '-400px',
        zIndex: 9999,
        maxWidth: '380px',
        background: 'rgba(10, 15, 40, 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${getSeverityColor(alert.severity)}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${getSeverityColor(alert.severity)}40`,
        transition: 'right 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `${getSeverityColor(alert.severity)}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} color={getSeverityColor(alert.severity)} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#e5e7eb' }}>
              New Alert Detected
            </h4>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
            {alert.attack_type || 'Unknown Attack'}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '999px',
                background: `${getSeverityColor(alert.severity)}20`,
                color: getSeverityColor(alert.severity),
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {alert.severity}
            </span>
            {alert.src_ip && (
              <span style={{ color: '#6b7280' }}>
                From: <span style={{ color: '#e5e7eb' }}>{alert.src_ip}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
