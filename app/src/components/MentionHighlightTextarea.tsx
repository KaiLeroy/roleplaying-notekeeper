import React, { useEffect, useRef } from 'react';
import LinkedText from './LinkedText';

/** A textarea that shows live auto-link/suggestion highlighting behind the caret,
 * without any of the caret-preservation headaches of contentEditable: the real
 * <textarea> handles all typing natively (text made transparent, caret kept
 * visible), and a non-interactive backdrop underneath renders the same text
 * through LinkedText so mentions light up as you type. */
export default function MentionHighlightTextarea({
  value,
  onChange,
  excludeId,
  placeholder,
  autoFocus
}: {
  value: string;
  onChange: (v: string) => void;
  excludeId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
  }, [value]);

  return (
    <div className="capture-editor-wrap">
      <div className="capture-highlight" aria-hidden>
        <LinkedText text={value ? value + '​' : ''} excludeId={excludeId} paragraphs={false} />
      </div>
      <textarea
        ref={ref}
        className="capture-textarea"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
