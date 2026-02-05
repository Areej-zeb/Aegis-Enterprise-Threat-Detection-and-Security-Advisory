import React from 'react';
import '../../index.css';

const Card = ({ children, className = '', header, footer, variant = 'default', ...rest }) => {
  const classes = `prm-card prm-card--${variant} ${className}`.trim();

  return (
    <div className={classes} role="group" {...rest}>
      {header && <div className="prm-card-header">{header}</div>}
      <div className="prm-card-body">{children}</div>
      {footer && <div className="prm-card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
