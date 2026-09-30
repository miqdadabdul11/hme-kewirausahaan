import fs from 'fs';
import path from 'path';

const uiDir = path.join(process.cwd(), 'src/components/ui');

const components = {
  'Button.tsx': `
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseClass = \`\${styles.btn} \${styles[variant]} \${styles[size]} \${className}\`;
  return (
    <button className={baseClass} disabled={disabled || isLoading} {...props}>
      {isLoading ? <span className={styles.loader}></span> : children}
    </button>
  );
};
`,
  'Button.module.css': `
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-inter), sans-serif;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.primary {
  background-color: var(--green-500);
  color: var(--black-900);
}
.primary:hover:not(:disabled) {
  background-color: var(--green-400);
}
.secondary {
  background-color: var(--black-900);
  color: var(--white);
}
.secondary:hover:not(:disabled) {
  background-color: var(--black-700);
}
.danger {
  background-color: #dc2626;
  color: var(--white);
}
.ghost {
  background-color: transparent;
  color: var(--text);
  border: 1px solid var(--gray-500);
}
.sm { padding: 6px 12px; font-size: 0.875rem; }
.md { padding: 10px 16px; font-size: 1rem; }
.lg { padding: 14px 24px; font-size: 1.125rem; }

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0,0,0,0.2);
  border-bottom-color: currentColor;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}
@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`,
  'Card.tsx': `
import React from 'react';
import styles from './Card.module.css';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={\`\${styles.card} \${className}\`}>{children}</div>
);
`,
  'Card.module.css': `
.card {
  background: var(--white);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  padding: 20px;
  border: 1px solid var(--gray-100);
}
`,
  'Input.tsx': `
import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className={\`\${styles.wrapper} \${className}\`}>
    {label && <label className={styles.label}>{label}</label>}
    <input className={\`\${styles.input} \${error ? styles.errorInput : ''}\`} {...props} />
    {error && <span className={styles.errorText}>{error}</span>}
  </div>
);
`,
  'Input.module.css': `
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--black-900);
}
.input {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--gray-500);
  background: var(--white);
  font-family: inherit;
  transition: border-color 0.2s;
}
.input:focus {
  outline: none;
  border-color: var(--green-500);
}
.errorInput {
  border-color: #dc2626;
}
.errorText {
  color: #dc2626;
  font-size: 0.75rem;
}
`,
  'Badge.tsx': `
import React from 'react';
import styles from './Badge.module.css';

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'neutral' }> = ({ children, variant = 'neutral' }) => (
  <span className={\`\${styles.badge} \${styles[variant]}\`}>{children}</span>
);
`,
  'Badge.module.css': `
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.success { background: var(--green-100); color: #166534; }
.warning { background: #FEF08A; color: #854D0E; }
.error { background: #FEE2E2; color: #991B1B; }
.neutral { background: var(--gray-100); color: var(--gray-500); }
`
};

for (const [filename, content] of Object.entries(components)) {
  fs.writeFileSync(path.join(uiDir, filename), content.trim());
}

console.log('UI Components scaffolded!');
