import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface TimeRangeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
}

export const AnalyticsTimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  currentRange,
  onRangeChange,
}) => {
  const [showCustom, setShowCustom] = useState(false);

  const presets = [
    { id: 'last_15_min', label: 'Last 15 min' },
    { id: 'last_1_hour', label: 'Last 1 hour' },
    { id: 'last_24_hours', label: 'Last 24 hours' },
    { id: 'last_7_days', label: 'Last 7 days' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onRangeChange(preset.id)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: currentRange === preset.id ? '2px solid #5ac9ff' : '1px solid rgba(148, 163, 184, 0.3)',
            background: currentRange === preset.id ? 'rgba(90, 201, 255, 0.1)' : 'rgba(148, 163, 184, 0.05)',
            color: currentRange === preset.id ? '#5ac9ff' : '#9fb3d9',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (currentRange !== preset.id) {
              e.currentTarget.style.borderColor = 'rgba(90, 201, 255, 0.5)';
              e.currentTarget.style.background = 'rgba(90, 201, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentRange !== preset.id) {
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
            }
          }}
        >
          {preset.label}
        </button>
      ))}

      <button
        onClick={() => setShowCustom(!showCustom)}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          background: 'rgba(148, 163, 184, 0.05)',
          color: '#9fb3d9',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(90, 201, 255, 0.5)';
          e.currentTarget.style.background = 'rgba(90, 201, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
          e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
        }}
      >
        <Calendar style={{ width: '14px', height: '14px' }} />
        Custom
      </button>
    </div>
  );
};
