import React from 'react';
import { segmentText } from '../lib/linking';
import { useCampaign } from '../state/CampaignContext';

function withBreaks(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split('\n');
  const out: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i > 0) out.push(<br key={`${keyPrefix}-br-${i}`} />);
    if (part) out.push(part);
  });
  return out;
}

export default function LinkedText({
  text,
  excludeId,
  onNavigate,
  onSuggestion,
  paragraphs = true
}: {
  text: string;
  excludeId?: string;
  onNavigate?: (entityId: string) => void;
  onSuggestion?: (phrase: string) => void;
  paragraphs?: boolean;
}) {
  const { matcher } = useCampaign();
  if (!text.trim()) return null;

  const renderInline = (chunk: string, keyPrefix: string) => {
    const segments = segmentText(chunk, matcher, excludeId);
    return segments.map((seg, i) => {
      const key = `${keyPrefix}-${i}`;
      if (seg.kind === 'link') {
        return (
          <span
            key={key}
            className="wl"
            role="link"
            tabIndex={0}
            onClick={() => onNavigate?.(seg.entityId!)}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.(seg.entityId!); }}
          >
            {withBreaks(seg.text, key)}
          </span>
        );
      }
      if (seg.kind === 'suggestion') {
        return (
          <span
            key={key}
            className="sug"
            role="button"
            tabIndex={0}
            title="Not linked yet — click to create an article"
            onClick={() => onSuggestion?.(seg.text)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSuggestion?.(seg.text); }}
          >
            {withBreaks(seg.text, key)}
          </span>
        );
      }
      if (seg.kind === 'self') {
        return <strong key={key} style={{ fontWeight: 500 }}>{withBreaks(seg.text, key)}</strong>;
      }
      return <React.Fragment key={key}>{withBreaks(seg.text, key)}</React.Fragment>;
    });
  };

  if (!paragraphs) return <>{renderInline(text, 'inline')}</>;

  const paras = text.split(/\n{2,}/);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i}>{renderInline(p, `p${i}`)}</p>
      ))}
    </>
  );
}
