import React from 'react';
import styles from './Badge.module.css';

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'neutral' }> = ({ children, variant = 'neutral' }) => (
  <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
);