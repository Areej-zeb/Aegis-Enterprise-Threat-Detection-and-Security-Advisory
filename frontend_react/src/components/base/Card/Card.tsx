/**
 * Card Component
 * 
 * A flexible card component for content containers with compound component pattern.
 * Supports header, body, and footer sections with consistent styling.
 * 
 * @example
 * ```tsx
 * <Card elevation="md">
 *   <Card.Header title="Alert Summary" />
 *   <Card.Body>
 *     <p>Critical alerts: 5</p>
 *   </Card.Body>
 *   <Card.Footer>
 *     <Button>View Details</Button>
 *   </Card.Footer>
 * </Card>
 * ```
 */

import React, { ReactNode } from 'react';
import styles from './Card.module.css';

/**
 * Card component props
 */
export interface CardProps {
  /**
   * Elevation level for shadow
   * @default 'md'
   */
  elevation?: 'sm' | 'md' | 'lg';

  /**
   * Whether card is interactive (shows hover effects)
   * @default false
   */
  interactive?: boolean;

  /**
   * Click handler for interactive cards
   */
  onClick?: () => void;

  /**
   * Card content
   */
  children: ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Card Header props
 */
export interface CardHeaderProps {
  /**
   * Header title
   */
  title?: string;

  /**
   * Header subtitle
   */
  subtitle?: string;

  /**
   * Action element (e.g., button, menu)
   */
  action?: ReactNode;

  /**
   * Custom header content
   */
  children?: ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Card Body props
 */
export interface CardBodyProps {
  /**
   * Body content
   */
  children: ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Card Footer props
 */
export interface CardFooterProps {
  /**
   * Footer content
   */
  children: ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Card Header Component
 * 
 * Renders the header section of a card with optional title, subtitle, and action.
 */
const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}) => {
  return (
    <div className={`${styles.header} ${className}`.trim()}>
      {children ? (
        children
      ) : (
        <>
          <div className={styles.headerContent}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </>
      )}
    </div>
  );
};

CardHeader.displayName = 'Card.Header';

/**
 * Card Body Component
 * 
 * Renders the main content section of a card.
 */
const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`${styles.body} ${className}`.trim()}>{children}</div>;
};

CardBody.displayName = 'Card.Body';

/**
 * Card Footer Component
 * 
 * Renders the footer section of a card.
 */
const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={`${styles.footer} ${className}`.trim()}>{children}</div>;
};

CardFooter.displayName = 'Card.Footer';

/**
 * Card Component
 * 
 * Renders a flexible card container with optional header, body, and footer sections.
 * Uses compound component pattern for flexible composition.
 * 
 * All styling uses design tokens for consistency.
 */
export const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({
  elevation = 'md',
  interactive = false,
  onClick,
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        ${styles.card}
        ${styles[`elevation-${elevation}`]}
        ${interactive ? styles.interactive : ''}
        ${className}
      `.trim()}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

// Attach sub-components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

Card.displayName = 'Card';
