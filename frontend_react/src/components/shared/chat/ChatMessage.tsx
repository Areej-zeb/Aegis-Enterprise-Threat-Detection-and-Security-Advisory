/**
 * Chat Message Component
 * Displays individual chat messages with support for markdown and code blocks
 */

import React from 'react';
import styles from './ChatMessage.module.css';

export interface ChatMessageProps {
  /** Message content (supports markdown) */
  content: string;

  /** Message role (user or assistant) */
  role: 'user' | 'assistant';

  /** Timestamp of the message */
  timestamp?: Date;

  /** Whether the message is loading */
  isLoading?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Chat Message Component
 * Displays chat messages with proper styling based on role
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  role,
  timestamp,
  isLoading = false,
  className = '',
}) => {
  const messageClasses = [
    styles['chat-message'],
    styles[`chat-message--${role}`],
    isLoading && styles['chat-message--loading'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    // Split by code blocks
    const parts = text.split(/```([\s\S]*?)```/);

    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // Code block
        return (
          <pre key={i} className={styles['chat-message__code']}>
            <code>{part.trim()}</code>
          </pre>
        );
      }

      // Regular text with basic formatting
      return (
        <p key={i} className={styles['chat-message__text']}>
          {part.split('\n').map((line, j) => (
            <React.Fragment key={j}>
              {line}
              {j < part.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  return (
    <div className={messageClasses}>
      <div className={styles['chat-message__container']}>
        <div className={styles['chat-message__avatar']}>
          {role === 'user' ? '👤' : '🤖'}
        </div>

        <div className={styles['chat-message__content']}>
          {isLoading ? (
            <div className={styles['chat-message__loading']}>
              <span className={styles['chat-message__loading-dot']} />
              <span className={styles['chat-message__loading-dot']} />
              <span className={styles['chat-message__loading-dot']} />
            </div>
          ) : (
            renderContent(content)
          )}
        </div>

        {timestamp && (
          <div className={styles['chat-message__timestamp']}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
