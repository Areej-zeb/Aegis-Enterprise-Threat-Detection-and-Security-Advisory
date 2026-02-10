import React, { ReactNode, useState } from 'react';

export interface MonitorLayoutProps {
  header?: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  leftPanelWidth?: number;
  children?: ReactNode;
}

export const MonitorLayout: React.FC<MonitorLayoutProps> = ({
  header,
  leftPanel,
  rightPanel,
  leftPanelWidth = 50,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(leftPanelWidth);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = (e.currentTarget as HTMLDivElement).parentElement;
    if (!container) return;
    const newWidth = (e.clientX / container.clientWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setWidth(newWidth);
    }
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {header && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          {header}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {leftPanel && (
          <>
            <div style={{ width: `${width}%`, overflowY: 'auto', borderRight: '1px solid #e5e7eb' }}>
              {leftPanel}
            </div>
            <div
              onMouseDown={handleMouseDown}
              style={{
                width: '4px',
                backgroundColor: isDragging ? '#3b5cff' : '#e5e7eb',
                cursor: 'col-resize',
                transition: isDragging ? 'none' : 'background-color 0.2s',
              }}
            />
          </>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rightPanel || children}
        </div>
      </div>
    </div>
  );
};

MonitorLayout.displayName = 'MonitorLayout';
