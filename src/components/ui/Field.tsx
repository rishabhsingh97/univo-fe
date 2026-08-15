import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import './ui.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, id, className, ...rest }: TextFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="field">
      <label className="field-label" htmlFor={fieldId}>{label}</label>
      <input id={fieldId} className={`input ${className ?? ''}`} {...rest} />
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, id, children, className, ...rest }: SelectFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="field">
      <label className="field-label" htmlFor={fieldId}>{label}</label>
      <select id={fieldId} className={`select ${className ?? ''}`} {...rest}>
        {children}
      </select>
    </div>
  );
}
