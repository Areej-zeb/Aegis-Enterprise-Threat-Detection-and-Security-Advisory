import React, { ReactNode } from 'react';
import '../../index.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`aegis-dash-header ${className}`}>
      <div>
        <h1 className="aegis-dash-title">{title}</h1>
        {subtitle && <p className="aegis-dash-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="aegis-dash-header-actions">{actions}</div>}
    </header>
  );
}
