import React from 'react';
import styles from './Card.module.css';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);