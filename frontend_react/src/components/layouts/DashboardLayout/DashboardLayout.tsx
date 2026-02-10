import React, { ReactNode } from 'react';

export interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  sidebar?: ReactNode;
  headerActions?: ReactNode;
  collapsibleSidebar?: boolean;
  children?: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  sidebar,
  headerActions,
  children,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(title || subtitle || headerActions) && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {title && <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{title}</h1>}
              {subtitle && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>{subtitle}</p>}
            </div>
            {headerActions && <div>{headerActions}</div>}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebar && (
          <div style={{ width: '280px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', padding: '1.5rem' }}>
            {sidebar}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

DashboardLayout.displayName = 'DashboardLayout';
