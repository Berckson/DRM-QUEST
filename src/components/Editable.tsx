import { useRef, useEffect } from 'react';

interface EditableProps {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  as?: 'div' | 'span';
  placeholder?: string;
}

/**
 * Click-to-edit inline text using contentEditable. Renders as plain text
 * (prints cleanly) but lets the user edit on focus and commits on blur.
 */
export function Editable({ value, onCommit, className = '', as = 'div', placeholder }: EditableProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  const handleBlur = () => {
    const next = ref.current?.innerText ?? '';
    if (next !== value) onCommit(next);
  };

  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      data-placeholder={placeholder}
      className={`outline-none rounded-sm focus:bg-accent/40 focus:ring-1 focus:ring-primary/40 px-0.5 -mx-0.5 transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 ${className}`}
    />
  );
}
