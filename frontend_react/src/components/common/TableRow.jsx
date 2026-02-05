import React from 'react';
import '../../index.css';

const TableRow = ({ children, onClick, isSelected = false, className = '', tabIndex = 0, ...rest }) => {
  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  const classes = `prm-table-row ${isSelected ? 'prm-table-row--selected' : ''} ${className}`.trim();

  return (
    <tr
      className={classes}
      role="row"
      tabIndex={onClick ? tabIndex : -1}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </tr>
  );
};

export default TableRow;
