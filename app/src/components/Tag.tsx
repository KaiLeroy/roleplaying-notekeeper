import React from 'react';

export default function Tag({
  children,
  tone = 'neutral',
  onRemove,
  onClick
}: {
  children: React.ReactNode;
  tone?: 'accent' | 'accent-2' | 'neutral' | 'outline';
  onRemove?: () => void;
  onClick?: () => void;
}) {
  const cls = `tag tag-${tone}`;
  const content = (
    <>
      {children}
      {onRemove && (
        <button
          className="reset-btn"
          style={{ marginLeft: 5, display: 'inline-flex', opacity: 0.7 }}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </>
  );
  if (onClick) {
    return (
      <button className={`reset-btn ${cls}`} onClick={onClick} style={{ cursor: 'pointer' }}>
        {content}
      </button>
    );
  }
  return <span className={cls}>{content}</span>;
}
