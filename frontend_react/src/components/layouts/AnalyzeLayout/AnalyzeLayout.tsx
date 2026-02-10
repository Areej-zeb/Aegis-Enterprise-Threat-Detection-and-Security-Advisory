import React, { ReactNode } from 'react';

export interface AnalyzeLayoutProps {
  title?: string;
  subtitle?: string;
  sidebar?: ReactNode;
  headerActions?: ReactNode;
  sidebarPosition?: 'left' | 'right';
  collapsibleSidebar?: boolean;
  content?: ReactNode;
  children?: ReactNode;
}

export const AnalyzeLayout: React.FC<AnalyzeLayoutProps> = ({
  title,
  subtitle,
  sidebar,
  headerActions,
  sidebarPosition = 'right',
  content,
  children,
}) => {
  const mainContent = content || children;

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
        {sidebar && sidebarPosition === 'left' && (
          <div style={{ width: '280px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', padding: '1.5rem' }}>
            {sidebar}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {mainContent}
        </div>
        {sidebar && sidebarPosition === 'right' && (
          <div style={{ width: '280px', borderLeft: '1px solid #e5e7eb', overflowY: 'auto', padding: '1.5rem' }}>
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
};

AnalyzeLayout.displayName = 'AnalyzeLayout';
