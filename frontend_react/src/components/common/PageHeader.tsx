import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  showWelcome?: boolean;
}

export function PageHeader({ title, subtitle, actions, className = '', showWelcome = false }: PageHeaderProps) {
  const { user } = useAuth();
  
  // Extract first name from user's name or email
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  
  // If showWelcome is true, use dynamic welcome message
  const displayTitle = showWelcome ? `Welcome Back, ${firstName}` : title;
  const displaySubtitle = showWelcome ? 'Your SME security overview and system activity summary.' : subtitle;

  return (
    <header className={`aegis-dash-header ${className}`}>
      <div>
        <h1 className="aegis-dash-title">{displayTitle}</h1>
        {displaySubtitle && <p className="aegis-dash-subtitle">{displaySubtitle}</p>}
      </div>
      {actions && <div className="aegis-dash-header-actions">{actions}</div>}
    </header>
  );
}
