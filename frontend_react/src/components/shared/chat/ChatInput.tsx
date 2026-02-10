/**
 * Chat Input Component
 * Text input for chat messages with auto-resize and file upload
 */

import React, { useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import styles from './ChatInput.module.css';

export interface ChatInputProps {
  /** Current input value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Submit handler */
  onSubmit: (message: string) => void;

  /** File upload handler */
  onFileUpload?: (file: File) => void;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Chat Input Component
 * Auto-resizing textarea with file upload support
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFileUpload,
  disabled = false,
  placeholder = 'Type your message...',
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit(value);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const containerClasses = [
    styles['chat-input'],
    disabled && styles['chat-input--disabled'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles['chat-input__wrapper']}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles['chat-input__textarea']}
          rows={1}
        />

        <div className={styles['chat-input__actions']}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={styles['chat-input__button']}
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className={styles['chat-input__file-input']}
            aria-hidden="true"
          />

          <button
            onClick={() => {
              if (value.trim()) {
                onSubmit(value);
              }
            }}
            disabled={disabled || !value.trim()}
            className={styles['chat-input__button']}
            title="Send message"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className={styles['chat-input__hint']}>
        Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
      </div>
    </div>
  );
};

ChatInput.displayName = 'ChatInput';

export default ChatInput;
