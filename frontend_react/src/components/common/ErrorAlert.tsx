import React from 'react';
import { AlertCircle } from 'lucide-react';
import '../../index.css';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className = '' }: ErrorAlertProps) {
  return (
    <div
      className={className}
      style={{
        padding: '0.75rem 1rem',
        background: '#111827',
        color: '#fbbf24',
        borderRadius: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}
    >
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}
